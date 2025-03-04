import { act, fireEvent } from "@testing-library/react-native"
import { RequestForPriceEstimateBannerTestsQuery } from "__generated__/RequestForPriceEstimateBannerTestsQuery.graphql"
import { __globalStoreTestUtils__, GlobalStoreProvider } from "app/store/GlobalStore"
import { mockTrackEvent } from "app/tests/globallyMockedStuff"
import { renderWithWrappers } from "app/tests/renderWithWrappers"
import { graphql, QueryRenderer } from "react-relay"
import { createMockEnvironment, MockPayloadGenerator } from "relay-test-utils"
import { RequestForPriceEstimateBanner } from "./RequestForPriceEstimateBanner"

jest.unmock("react-relay")

describe("RequestForPriceEstimateBanner", () => {
  let mockEnvironment: ReturnType<typeof createMockEnvironment>
  const TestRenderer = () => (
    <QueryRenderer<RequestForPriceEstimateBannerTestsQuery>
      environment={mockEnvironment}
      query={graphql`
        query RequestForPriceEstimateBannerTestsQuery @relay_test_operation {
          artwork(id: "foo") {
            ...RequestForPriceEstimateBanner_artwork
          }
          marketPriceInsights(artistId: "some-artist-id", medium: "painting") {
            ...RequestForPriceEstimateBanner_marketPriceInsights
          }
          me {
            ...RequestForPriceEstimateBanner_me
          }
        }
      `}
      variables={{}}
      render={({ props }) => {
        if (props?.artwork && props?.marketPriceInsights && props?.me) {
          return (
            <GlobalStoreProvider>
              <RequestForPriceEstimateBanner
                me={props.me}
                artwork={props.artwork}
                marketPriceInsights={props.marketPriceInsights}
              />
            </GlobalStoreProvider>
          )
        }
        return null
      }}
    />
  )

  beforeEach(() => {
    mockEnvironment = createMockEnvironment()
    __globalStoreTestUtils__?.injectFeatureFlags({ AREnableNewRequestPriceEstimateLogic: true })
  })

  afterEach(() => {
    jest.clearAllMocks()
    __globalStoreTestUtils__?.reset()
  })

  const resolveData = (passedProps = {}) => {
    mockEnvironment.mock.resolveMostRecentOperation((operation) =>
      MockPayloadGenerator.generate(operation, passedProps)
    )
  }

  it("renders without throwing an error", () => {
    const { getByTestId } = renderWithWrappers(<TestRenderer />)
    resolveData({
      Artwork: () => ({
        internalID: "some-internal-id",
        submissionId: null,
        hasPriceEstimateRequest: false,
        artist: {
          targetSupply: {
            isP1: true,
          },
        },
      }),
      MarketPriceInsights: () => ({
        demandRank: 7.5,
      }),
    })
    expect(getByTestId("request-price-estimate-button")).toBeDefined()
    expect(getByTestId("request-price-estimate-banner-title")).toBeDefined()
    expect(getByTestId("request-price-estimate-banner-description")).toBeDefined()
  })

  it("renders 'requested' state if in global store without throwing an error", () => {
    const { getByText } = renderWithWrappers(<TestRenderer />)
    resolveData({
      Artwork: () => ({
        internalID: "artwork-id",
        slug: "artwork-id",
        hasPriceEstimateRequest: null,
      }),
      MarketPriceInsights: () => ({
        demandRank: 7.5,
      }),
    })
    __globalStoreTestUtils__?.injectState({
      requestedPriceEstimates: {
        requestedPriceEstimates: {
          "artwork-id": {
            artworkId: "artwork-id",
            requestedAt: 1666015648950,
          },
        },
      },
    })
    expect(getByText("Price Estimate Request Sent")).toBeDefined()
  })

  it("renders 'requested' state if hasPriceEstimateRequest is true", () => {
    const { getByText } = renderWithWrappers(<TestRenderer />)
    resolveData({
      Artwork: () => ({
        internalID: "artwork-id",
        slug: "artwork-id",
        hasPriceEstimateRequest: true,
      }),
      MarketPriceInsights: () => ({
        demandRank: 7.5,
      }),
    })
    expect(getByText("Price Estimate Request Sent")).toBeDefined()
  })

  it("tracks analytics event when RequestForEstimate button is tapped", () => {
    const { getByTestId } = renderWithWrappers(<TestRenderer />)
    resolveData({
      Artwork: () => ({
        internalID: "artwork-id",
        slug: "artwork-slug",
        submissionId: null,
        hasPriceEstimateRequest: false,
        artist: {
          targetSupply: {
            isP1: true,
          },
        },
      }),
      MarketPriceInsights: () => ({
        demandRank: 7.5,
      }),
    })

    const TheButton = getByTestId("request-price-estimate-button")

    act(() => {
      fireEvent.press(TheButton)
    })

    expect(mockTrackEvent).toHaveBeenCalledTimes(1)
    expect(mockTrackEvent).toHaveBeenCalledWith({
      action: "tappedRequestPriceEstimate",
      context_module: "myCollectionArtworkInsights",
      context_screen: "MyCollectionArtworkInsights",
      context_screen_owner_type: "myCollectionArtwork",
      context_screen_owner_id: "artwork-id",
      context_screen_owner_slug: "artwork-slug",
      demand_index: 7.5,
    })
  })
})
