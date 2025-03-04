import * as glibphone from "google-libphonenumber"
import replace from "lodash/replace"
import {
  Flex,
  Input,
  InputProps,
  InputRef,
  Spacer,
  Text,
  Touchable,
  TriangleDown,
  useColor,
} from "palette"
import { forwardRef, useImperativeHandle } from "react"
import { useEffect, useRef, useState } from "react"
import { Platform } from "react-native"
import { Select, SelectOption } from "../../Select"
import { cleanUserPhoneNumber } from "./cleanUserPhoneNumber"
import { countries, countryIndex } from "./countries"
import { formatPhoneNumber } from "./formatPhoneNumber"

/** Underline bar height for text input on android when focused */
const UNDERLINE_TEXTINPUT_HEIGHT_ANDROID = 1.5

export const PhoneInput = forwardRef<
  InputRef,
  {
    setValidation: (value: boolean) => void
    onChange?: (value: string) => void
    maxModalHeight?: number
    shouldDisplayLocalError?: boolean
  } & Omit<InputProps, "onChange">
>(
  (
    {
      value,
      setValidation,
      onChange,
      onChangeText,
      maxModalHeight,
      shouldDisplayLocalError = true,
      ...rest
    },
    ref
  ) => {
    const color = useColor()
    const innerRef = useRef<InputRef>(null)
    useImperativeHandle(ref, () => innerRef.current!)
    const initialValues = cleanUserPhoneNumber(value ?? "")
    const [countryCode, setCountryCode] = useState<string>(initialValues.countryCode)
    const [phoneNumber, setPhoneNumber] = useState(
      formatPhoneNumber({
        current: initialValues.phoneNumber,
        previous: initialValues.phoneNumber,
        countryCode,
      })
    )
    const [validationErrorMessage, setValidationErrorMessage] = useState("")
    const dialCode = countryIndex[countryCode].dialCode
    const countryISO2Code = countryIndex[countryCode].iso2
    const phoneUtil = glibphone.PhoneNumberUtil.getInstance()

    useEffect(() => {
      if (isFirstRun.current) {
        return
      }

      const cleanPhoneNumber = cleanUserPhoneNumber(value ?? "")
      const formattedPhoneNumber = formatPhoneNumber({
        current: cleanPhoneNumber.phoneNumber,
        previous: initialValues.phoneNumber,
        countryCode: cleanPhoneNumber.countryCode,
      })

      setPhoneNumber(formattedPhoneNumber.replace(/\D+$/, ""))
      setCountryCode(cleanPhoneNumber.countryCode)
    }, [value])

    const isValidNumber = (number: string, code: string) => {
      try {
        number = replace(number, /[+()-\s]/g, "")
        const parsedNumber = phoneUtil.parse(number, code)
        return phoneUtil.isValidNumber(parsedNumber)
      } catch (err) {
        return false
      }
    }

    const handleValidation = () => {
      const isValid = isValidNumber(phoneNumber, countryISO2Code)
      setValidation(isValid)

      if (shouldDisplayLocalError) {
        setValidationErrorMessage(isValid ? "" : "Please enter a valid phone number.")
      }
    }

    const isFirstRun = useRef(true)
    useEffect(() => {
      if (isFirstRun.current) {
        if (phoneNumber.length > 0) {
          handleValidation()
        }
        isFirstRun.current = false
        return
      }

      handleValidation()

      const newValue = phoneNumber ? `+${dialCode} ${phoneNumber}` : ""

      onChangeText?.(newValue)
      onChange?.(newValue)
    }, [phoneNumber, dialCode])

    return (
      <Flex style={{ height: 50 }}>
        <Input
          style={{ flex: 1 }}
          {...rest}
          ref={innerRef}
          value={phoneNumber}
          inputTextStyle={Platform.select({
            android: { paddingTop: UNDERLINE_TEXTINPUT_HEIGHT_ANDROID },
            default: {},
          })}
          placeholder={countryIndex[countryCode]?.mask?.replace(/9/g, "0")}
          placeholderTextColor={color("black30")}
          onChangeText={(newPhoneNumber) =>
            setPhoneNumber(
              formatPhoneNumber({ current: newPhoneNumber, previous: phoneNumber, countryCode })
            )
          }
          keyboardType="phone-pad"
          renderLeftHandSection={() => (
            <Select<string>
              options={countryOptions}
              enableSearch
              value={countryCode}
              maxModalHeight={maxModalHeight}
              onModalFinishedClosing={() => {
                innerRef.current?.focus()
              }}
              onSelectValue={(newCountryCode) => {
                setCountryCode(newCountryCode)
                setPhoneNumber(
                  formatPhoneNumber({
                    current: phoneNumber,
                    previous: phoneNumber,
                    countryCode: newCountryCode,
                  })
                )
              }}
              title="Country code"
              renderButton={({ selectedValue, onPress }) => {
                return (
                  <Touchable onPress={onPress}>
                    <Flex flexDirection="row" style={{ width: "100%", height: "100%" }}>
                      <Flex
                        flexDirection="row"
                        px="1"
                        alignItems="center"
                        backgroundColor="black10"
                      >
                        {/* selectedValue should always be present */}
                        <Text variant="sm-display">
                          {countryIndex[selectedValue ?? countryCode].flag}
                        </Text>
                        <Spacer mr={0.5} />
                        <TriangleDown width="8" />
                      </Flex>
                      <Flex justifyContent="center" pl="1">
                        <Text variant="sm" color="black60">
                          +{dialCode}
                        </Text>
                      </Flex>
                    </Flex>
                  </Touchable>
                )
              }}
              // tslint:disable-next-line:no-shadowed-variable
              renderItemLabel={({ label, value }) => {
                return (
                  <Flex flexDirection="row" alignItems="center" flexShrink={1}>
                    <Text variant="sm-display">{countryIndex[value].flag}</Text>
                    <Spacer mr="1" />
                    <Text variant="sm-display" style={{ width: 45 }}>
                      +{countryIndex[value].dialCode}
                    </Text>
                    <Spacer mr="1" />
                    <Text
                      variant="sm-display"
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      style={{ flexShrink: 1 }}
                    >
                      {label}
                    </Text>
                  </Flex>
                )
              }}
            />
          )}
          error={
            shouldDisplayLocalError && validationErrorMessage ? validationErrorMessage : rest.error
          }
        />
      </Flex>
    )
  }
)

const countryOptions: Array<SelectOption<string>> = countries.map((c) => {
  return {
    label: c.name,
    value: c.iso2,
    searchImportance: c.priority,
    searchTerms: [
      c.dialCode,
      "+" + c.dialCode,
      c.name,
      // individual words of country name
      ...c.name.split(/\W+/g),
      // initials of country name
      c.name
        .split(/\W+/g)
        .map((word) => word[0])
        .join(""),
    ],
  }
})
