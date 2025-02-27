import { renderWithWrappersLEGACY } from "app/tests/renderWithWrappers"
import { Text } from "palette"
import { TouchableWithoutFeedback } from "react-native"
import { RadioButton } from "./RadioButton"

it("shows text and subtitle within the radio button", () => {
  const component = renderWithWrappersLEGACY(<RadioButton text="Remember me" subtitle="Subtitle" />)

  expect(component.root.findAllByType(Text).length).toEqual(2)
  expect(component.root.findAllByType(Text)[0].props.children).toEqual("Remember me")
  expect(component.root.findAllByType(Text)[1].props.children).toEqual("Subtitle")
})

it("calls onPress when tapped", () => {
  const onPress = jest.fn()

  const component = renderWithWrappersLEGACY(<RadioButton onPress={onPress} />)

  component.root.findByType(TouchableWithoutFeedback).props.onPress()

  expect(onPress).toHaveBeenCalled()
})
