import { defaultEnvironment } from "lib/relay/createEnvironment"
import React from "react"
import { act } from "react-test-renderer"
import { createMockEnvironment } from "relay-test-utils"

jest.mock("lib/Components/Home/ArtistRails/ArtistRail", () => ({
  ArtistRailFragmentContainer: jest.fn(() => null),
}))
jest.mock("lib/Scenes/Home/Components/ArtworkRail", () => ({
  ArtworkRailFragmentContainer: jest.fn(() => null),
}))
jest.mock("lib/Scenes/Home/Components/FairsRail", () => ({
  FairsRailFragmentContainer: jest.fn(() => null),
}))
jest.mock("lib/Scenes/Home/Components/SalesRail", () => ({
  SalesRailFragmentContainer: jest.fn(() => null),
}))

import { EmailConfirmationBanner } from "lib/Scenes/Home/Components/EmailConfirmationBanner"
import { SalesRailFragmentContainer } from "lib/Scenes/Home/Components/SalesRail"
import { GlobalStoreProvider } from "lib/store/GlobalStore"
import { renderWithWrappers } from "lib/tests/renderWithWrappers"
import { GraphQLResponse } from "relay-runtime"
import { FairsRailFragmentContainer } from "./Components/FairsRail"
import { HomeQueryRenderer } from "./Home"

jest.unmock("react-relay")
const env = (defaultEnvironment as any) as ReturnType<typeof createMockEnvironment>

const TestRenderer: React.FC = () => {
  return (
    <GlobalStoreProvider>
      <HomeQueryRenderer />
    </GlobalStoreProvider>
  )
}

describe(HomeQueryRenderer, () => {
  it("always renders sales and fairs", () => {
    const tree = renderWithWrappers(<TestRenderer />)

    mockMostRecentOperation("HomeAboveTheFoldQuery", {
      errors: [],
      data: {
        homePage: {
          artworkModules: [],
          salesModule: [],
        },
        me: {
          canRequestEmailConfirmation: false,
        },
      },
    })
    mockMostRecentOperation("HomeBelowTheFoldQuery", {
      errors: [],
      data: {
        homePage: {
          artistModules: [],
          fairsModule: [],
        },
      },
    })

    expect(tree.root.findAllByType(SalesRailFragmentContainer)).toHaveLength(1)
    expect(tree.root.findAllByType(FairsRailFragmentContainer)).toHaveLength(1)
  })

  it("renders an email confirmation banner", () => {
    const tree = renderWithWrappers(<TestRenderer />)
    mockMostRecentOperation("HomeAboveTheFoldQuery", {
      errors: [],
      data: {
        homePage: {
          artworkModules: [],
        },
        me: {
          canRequestEmailConfirmation: false,
        },
      },
    })

    expect(tree.root.findAllByType(EmailConfirmationBanner)).toHaveLength(1)
  })
})

const mockMostRecentOperation = (name: string, result: GraphQLResponse = { errors: [] }) => {
  expect(env.mock.getMostRecentOperation().request.node.operation.name).toBe(name)

  act(() => {
    env.mock.resolveMostRecentOperation(result)
  })
}