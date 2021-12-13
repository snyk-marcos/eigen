import { fireEvent } from "@testing-library/react-native"
import { __globalStoreTestUtils__ } from "lib/store/GlobalStore"
import { renderWithWrappersTL } from "lib/tests/renderWithWrappers"
import React from "react"
import { ArtworkFilterApplyButton, ArtworkFilterApplyButtonProps } from "./ArtworkFilterApplyButton"

const defaultProps: ArtworkFilterApplyButtonProps = {
  disabled: false,
  onCreateAlertPress: jest.fn,
  onPress: jest.fn,
}

describe("ArtworkFilterApplyButton", () => {
  beforeEach(() => {
    __globalStoreTestUtils__?.injectFeatureFlags({ AREnableImprovedAlertsFlow: true })
  })

  const TestWrapper = (props?: Partial<ArtworkFilterApplyButtonProps>) => {
    return <ArtworkFilterApplyButton {...defaultProps} {...props} />
  }

  it("cannot press if disabled prop is passed", () => {
    const onPressMock = jest.fn()
    const { getByText } = renderWithWrappersTL(<TestWrapper disabled />)
    const button = getByText("Apply Filters")

    fireEvent.press(button)

    expect(button).toBeDisabled()
    expect(onPressMock).not.toBeCalled()
  })

  it('should call "onPress" handler when it is pressed', () => {
    const onPressMock = jest.fn()
    const { getByText } = renderWithWrappersTL(<TestWrapper onPress={onPressMock} />)

    fireEvent.press(getByText("Apply Filters"))

    expect(onPressMock).toBeCalled()
  })

  it('should show "Create Alert" button only when shouldShowCreateAlertButton prop is specified', () => {
    const { getByText } = renderWithWrappersTL(<TestWrapper shouldShowCreateAlertButton />)

    expect(getByText("Create Alert")).toBeTruthy()
  })

  it('should call "onCreateAlertPress" handler when "Create Alert" is pressed', () => {
    const onCreateAlertPressMock = jest.fn()
    const { getByText } = renderWithWrappersTL(
      <TestWrapper shouldShowCreateAlertButton onCreateAlertPress={onCreateAlertPressMock} />
    )

    fireEvent.press(getByText("Create Alert"))

    expect(onCreateAlertPressMock).toBeCalled()
  })
})