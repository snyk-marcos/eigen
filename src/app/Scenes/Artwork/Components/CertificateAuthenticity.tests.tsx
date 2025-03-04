import { fireEvent } from "@testing-library/react-native"
import { navigate } from "app/navigation/navigate"
import { renderWithWrappers } from "app/tests/renderWithWrappers"
import { CertificateOfAuthenticity } from "./CertificateAuthenticity"

jest.mock("app/navigation/navigate", () => ({
  navigate: jest.fn(),
}))

describe("CertificateAuthenticity", () => {
  it("renders", () => {
    const { getByText } = renderWithWrappers(<CertificateOfAuthenticity />)

    expect(getByText("A certificate of authenticity (COA)", { exact: false })).toBeDefined()
    expect(
      getByText("COAs typically include the name of the artist,", { exact: false })
    ).toBeDefined()
    expect(getByText("Read more about artwork authenticity in our", { exact: false })).toBeDefined()
    expect(getByText("Help Center")).toBeDefined()
  })

  it("navigates to support page", () => {
    const { getByText } = renderWithWrappers(<CertificateOfAuthenticity />)

    fireEvent.press(getByText("Help Center"))
    expect(navigate).toHaveBeenCalledWith(
      "https://support.artsy.net/hc/en-us/articles/360058123933-What-Counts-as-an-Artwork-s-Proof-of-Authenticity-"
    )
  })
})
