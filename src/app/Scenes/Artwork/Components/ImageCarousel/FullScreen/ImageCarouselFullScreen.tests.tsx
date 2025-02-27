import { render } from "@testing-library/react-native"
import { GlobalStoreProvider } from "app/store/GlobalStore"
import { Theme } from "palette"
import { ImageCarouselContext, useNewImageCarouselContext } from "../ImageCarouselContext"
import { ImageCarouselFullScreen } from "./ImageCarouselFullScreen"

describe("ImageCarouselFullScreen", () => {
  const Mock = () => {
    const value = useNewImageCarouselContext({
      images: [
        {
          height: 5,
          width: 5,
          url: "a",
          deepZoom: { image: { size: { width: 5, height: 5 } } as any },
        },
        {
          height: 5,
          width: 5,
          url: "b",
          deepZoom: { image: { size: { width: 5, height: 5 } } as any },
        },
      ],
    })
    return (
      <GlobalStoreProvider>
        <Theme>
          <ImageCarouselContext.Provider value={value}>
            <ImageCarouselFullScreen />
          </ImageCarouselContext.Provider>
        </Theme>
      </GlobalStoreProvider>
    )
  }

  it("render only the current zoomable image as a perf optimisation", () => {
    const { getAllByLabelText } = render(<Mock />)

    expect(getAllByLabelText("Full Screen Image")).toHaveLength(1)
    expect(getAllByLabelText("Full Screen Image Blank Box")).toHaveLength(1)
  })
})
