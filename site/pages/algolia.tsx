import algoliasearch from 'algoliasearch/lite'
import {
  Configure,
  Hits,
  InstantSearch,
  InstantSearchServerState,
  InstantSearchSSRProvider,
} from 'react-instantsearch-hooks-web'
import { getServerState } from 'react-instantsearch-hooks-server'
import { history } from 'instantsearch.js/es/lib/routers/index.js'
import { Page } from '@commerce/types/page'
import { Category } from '@commerce/types/site'
import { GetServerSideProps } from 'next'
import commerce from '@lib/api/commerce'
import { FC } from 'react'
import { BaseHit, Hit } from 'instantsearch.js'
import { Layout } from '@components/common'

const searchClient = algoliasearch(
  'latency',
  '6be0576ff61c053d5f9a3225e2a90f76'
)

type PageProps = {
  categories: Category[]
  pages: Page[]
  serverState?: InstantSearchServerState
  serverUrl: string
}

export default function Algolia({ serverState, serverUrl }: PageProps) {
  return (
    <div>
      <InstantSearchSSRProvider {...serverState}>
        <InstantSearch
          searchClient={searchClient}
          indexName="instant_search"
          routing={{
            router: history({
              getLocation() {
                if (typeof window === 'undefined') {
                  return new URL(serverUrl) as unknown as Location
                }

                return window.location
              },
            }),
          }}
        >
          <Configure hitsPerPage={12} />
          <Hits
            classNames={{
              list: 'p-4 grid gap-4 grid-cols-2 lg:grid-cols-4',
              item: 'border p-3 bg-gray-100',
            }}
            hitComponent={HitComponent}
          />
        </InstantSearch>
      </InstantSearchSSRProvider>
    </div>
  )
}

type HitProps = {
  hit: Hit<{
    name: string
    price: number
  }>
}

const HitComponent: FC<HitProps> = ({ hit }) => {
  return (
    <div>
      <p>{hit.name}</p>
      <p>{hit.price}</p>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps<PageProps> = async ({
  req,
  locale,
  locales,
  preview,
}) => {
  const config = { locale, locales }
  const pagesPromise = commerce.getAllPages({ config, preview })
  const siteInfoPromise = commerce.getSiteInfo({ config, preview })
  const { categories } = await siteInfoPromise
  const { pages } = await pagesPromise

  const protocol = req.headers.referer?.split('://')[0] || 'https'
  const serverUrl = `${protocol}://${req.headers.host}${req.url}`
  const serverState = await getServerState(
    <Algolia pages={pages} categories={categories} serverUrl={serverUrl} />
  )

  return {
    props: {
      pages,
      categories,
      serverState,
      serverUrl,
    },
  }
}

Algolia.Layout = Layout
