import { SectionTitle } from "app/Components/SectionTitle"
import { navigate } from "app/navigation/navigate"
import { BMWSponsorship } from "app/Scenes/City/CityBMWSponsorship"
import { ClassTheme, Flex, Spacer, Text } from "palette"
import React from "react"
import { Image, TouchableOpacity } from "react-native"

export class CityGuideCTA extends React.Component {
  render() {
    const cityGuideMapImage = require("images/city-guide-bg.webp")
    return (
      <ClassTheme>
        {({ color }) => (
          <Flex>
            <SectionTitle title="Explore art on view" />
            <TouchableOpacity onPress={() => navigate("/local-discovery")}>
              <Flex
                style={{
                  borderWidth: 1,
                  borderColor: color("black10"),
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <Image source={cityGuideMapImage} style={{ width: "100%" }} />
                <Flex m={15}>
                  <Text variant="sm" weight="medium">
                    City Guide
                  </Text>
                  <Text variant="sm" style={{ color: color("black60") }}>
                    Browse fairs and shows in different cities
                  </Text>
                  <Spacer mb={1} />
                  <BMWSponsorship logoText="Presented in partnership with BMW" pressable={false} />
                </Flex>
              </Flex>
            </TouchableOpacity>
          </Flex>
        )}
      </ClassTheme>
    )
  }
}
