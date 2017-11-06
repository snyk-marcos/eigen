import * as React from "react"
import { createFragmentContainer, graphql } from "react-relay"
import styled from "styled-components/native"

import { Dimensions, ScrollView, Text, TouchableOpacity, View, ViewProperties, ViewStyle } from "react-native"
import SwitchBoard from "../NativeModules/SwitchBoard"

import { Colors } from "../../data/colors"
import { Fonts } from "../../data/fonts"

import Separator from "../Components/Separator"
import SerifText from "../Components/Text/Serif"

const AvatarCircle = styled.View`
  background-color: ${Colors.GrayRegular};
  height: 123;
  width: 123;
  justify-content: center;
  align-items: center;
  border-radius: 61.5;
`

const AvatarText = styled.Text`
  font-family: ${Fonts.AvantGardeRegular};
  font-size: 16;
`

const HeaderWrapper = styled.View`
  align-items: center;
  margin-top: 82;
`

const UserName = styled(SerifText)`
  font-size: 26;
  text-align: center;
  margin-top: 24;
`

const ButtonSection = styled.View`
  align-items: center;
  margin-top: 82;
`

const ButtonSectionText = styled.Text`
  margin-top: 24;
  font-family: ${Fonts.AvantGardeRegular};
  font-size: 14;
  margin-bottom: 8;
`

const ButtonDescriptionText = styled(SerifText)`
  color: #999999;
  font-size: 26;
  margin-bottom: 12;
`

/**
 *      [OT]
 *   Orta Therox
 */
const Header = ({ me }) =>
  <HeaderWrapper>
    <AvatarCircle>
      <AvatarText>
        {me.initials}
      </AvatarText>
    </AvatarCircle>
    <UserName style={{ fontSize: 26, textAlign: "center", marginTop: 24 }}>
      {me.name}
    </UserName>
  </HeaderWrapper>

/**
 * ---------------
 *  NAME
 *  description
 * ---------------
 */

const ProfileButton = ({ section, description, isTop, onPress }) =>
  <TouchableOpacity onPress={onPress} style={{ width: 330 }}>
    <View>
      {isTop && <Separator />}
      <ButtonSectionText>
        {section.toUpperCase()}
      </ButtonSectionText>
      <ButtonDescriptionText>
        {description}
      </ButtonDescriptionText>
      <Separator />
    </View>
  </TouchableOpacity>

interface Props extends ViewProperties, RelayProps {}

export class MyProfile extends React.Component<Props, {}> {
  render() {
    const windowDimensions = Dimensions.get("window")
    const commonPadding = windowDimensions.width > 700 ? 40 : 20

    const goToConsignmentsOverview = () => SwitchBoard.presentNavigationViewController(this, "/user/consignments")
    const goToUserSettings = () => SwitchBoard.presentNavigationViewController(this, "/profile/edit/ios")

    return (
      <ScrollView scrollsToTop={true} automaticallyAdjustContentInsets={false}>
        <Header me={this.props.me} />
        <ButtonSection>
          <ProfileButton
            section="Selling"
            description="Sell works from you collection"
            onPress={goToConsignmentsOverview}
            isTop
          />
          <ProfileButton
            section="Account Details"
            description="Email, password reset, profile"
            onPress={goToUserSettings}
            isTop={false}
          />
        </ButtonSection>
      </ScrollView>
    )
  }
}

export default createFragmentContainer(
  MyProfile,
  graphql`
    fragment MyProfile_me on Me {
      name
      initials
    }
  `
)

interface RelayProps {
  me: {
    name: string | null
    initials: string | null
  }
}
