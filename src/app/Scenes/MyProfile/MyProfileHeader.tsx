import { useNavigation } from "@react-navigation/native"
import { MyProfileHeader_me$key } from "__generated__/MyProfileHeader_me.graphql"
import { FancyModalHeader } from "app/Components/FancyModal/FancyModalHeader"
import { navigate } from "app/navigation/navigate"
import {
  Avatar,
  Box,
  BriefcaseIcon,
  EditIcon,
  Flex,
  MapPinIcon,
  MuseumIcon,
  Text,
  Touchable,
  useColor,
} from "palette"
import React, { useContext } from "react"
import { Image } from "react-native"
import { useFragment } from "react-relay"
import { graphql } from "relay-runtime"
import { MyProfileContext } from "./MyProfileProvider"
import { normalizeMyProfileBio } from "./utils"

const ICON_SIZE = 14

export const MyProfileHeader: React.FC<{ me: MyProfileHeader_me$key }> = (props) => {
  const me = useFragment(myProfileHeaderFragment, props.me)

  const color = useColor()
  const navigation = useNavigation()

  const { localImage } = useContext(MyProfileContext)

  const userProfileImagePath = localImage || me?.icon?.url

  return (
    <>
      <FancyModalHeader
        rightButtonText="Settings"
        hideBottomDivider
        onRightButtonPress={() => {
          navigate("/my-profile/settings")
        }}
      />

      <Flex flexDirection="row" alignItems="center" px={2}>
        <Box
          height="45"
          width="45"
          borderRadius="50"
          backgroundColor={color("black10")}
          justifyContent="center"
          alignItems="center"
        >
          {!!userProfileImagePath ? (
            <Avatar src={userProfileImagePath} size="xs" />
          ) : (
            <Image source={require("images/profile_placeholder_avatar.webp")} />
          )}
        </Box>
        <Flex flex={1} px={1}>
          <Text fontSize={20} lineHeight={24} color={color("black100")}>
            {me?.name}
          </Text>
          {!!me?.createdAt && (
            <Text variant="xs" color={color("black60")}>{`Member since ${new Date(
              me?.createdAt
            ).getFullYear()}`}</Text>
          )}
        </Flex>
        <Touchable
          haptic
          hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
          // @ts-expect-error
          onPress={() => navigation.navigate("MyProfileEditForm")}
        >
          <EditIcon fill="black100" />
        </Touchable>
      </Flex>

      {!!me?.bio && (
        <Text variant="xs" color={color("black100")} px={2} pt={1}>
          {normalizeMyProfileBio(me?.bio)}
        </Text>
      )}

      <Flex flexDirection="row" flexWrap="wrap" px={2} pt={1}>
        {!!me?.location?.display && (
          <Flex flexDirection="row" alignItems="center" pr={0.5} pb={0.5}>
            <MapPinIcon fill="black60" width={ICON_SIZE} height={ICON_SIZE} />
            <Text variant="xs" color={color("black60")} px={0.5}>
              {me.location.display}
            </Text>
          </Flex>
        )}

        {!!me?.profession && (
          <Flex flexDirection="row" alignItems="center" pr={0.5} pb={0.5}>
            <BriefcaseIcon fill="black60" width={ICON_SIZE} height={ICON_SIZE} />
            <Text variant="xs" color={color("black60")} px={0.5}>
              {me.profession}
            </Text>
          </Flex>
        )}

        {!!me?.otherRelevantPositions && (
          <Flex flexDirection="row" alignItems="center" pr={0.5} pb={0.5}>
            <MuseumIcon fill="black60" width={ICON_SIZE} height={ICON_SIZE} />
            <Text variant="xs" color={color("black60")} px={0.5}>
              {me?.otherRelevantPositions}
            </Text>
          </Flex>
        )}
      </Flex>
    </>
  )
}

const myProfileHeaderFragment = graphql`
  fragment MyProfileHeader_me on Me {
    name
    bio
    location {
      display
    }
    otherRelevantPositions
    profession
    icon {
      url(version: "thumbnail")
    }
    createdAt
  }
`
