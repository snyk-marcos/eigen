import { BottomSheetScrollView } from "@gorhom/bottom-sheet"
import { uniq } from "lodash"
import {
  ArtworkIcon,
  Box,
  FairIcon,
  Flex,
  GroupIcon,
  PublicationIcon,
  SoloIcon,
  Spacer,
  Text,
} from "palette"
import { useMemo } from "react"
import { useScreenDimensions } from "shared/hooks"
import { CareerHighlightKindValueType } from "../CareerHighlightBottomSheet"

interface CareerHighlightBottomSheetItemProps {
  year: string | number
  highlights: Record<CareerHighlightKindValueType, string[]>
}
export const CareerHighlightBottomSheetItem: React.FC<CareerHighlightBottomSheetItemProps> = ({
  year,
  highlights,
}) => {
  const dimensions = useScreenDimensions()

  const headerAndBodyTuple = useMemo(() => Object.entries(highlights), [JSON.stringify(highlights)])

  return (
    <Flex flex={1} minWidth={dimensions.width} p={2}>
      <Flex pb={2}>
        <Text variant="lg-display">{year} Career Highlights</Text>
      </Flex>
      {/** Flex wrap to allow horizontal scroll possible so the BottomSheetScrollView does not cover everywhere */}
      <Flex flex={1} flexWrap="wrap">
        <BottomSheetScrollView showsVerticalScrollIndicator={false}>
          {headerAndBodyTuple.map(([header, body], i) => (
            <SectionedHighlight key={header + i} header={header} body={body} />
          ))}
          <Spacer p={6} />
        </BottomSheetScrollView>
      </Flex>
    </Flex>
  )
}

const SectionedHighlight: React.FC<{ header: string; body: string[] }> = ({ header, body }) => {
  const getHeader = (headerStr: string, bodyCount: number) => {
    let text = ""
    let IconComponent: JSX.Element | null = null
    switch (headerStr) {
      case "Solo Show":
        text =
          bodyCount > 1 ? "Solo shows at major institutions" : "Solo show at a major institution"
        IconComponent = <SoloIcon />
        break
      case "Group Show":
        text =
          bodyCount > 1 ? "Group shows at major institutions" : "Group show at a major institution"
        IconComponent = <GroupIcon />
        break
      case "Review":
        text =
          bodyCount > 1
            ? "Reviewed by major art publications"
            : "Reviewed by a major art publication"
        IconComponent = <PublicationIcon />
        break
      case "Biennial Inclusion":
        text =
          bodyCount > 1 ? "Included in multiple major biennials" : "Included in a major biennial"
        IconComponent = <FairIcon />
        break
      case "undefined":
        // we don't know for now what new types may be added in the future
        text = "Other"
        IconComponent = <ArtworkIcon />
        break
      default:
    }
    return { text, IconComponent }
  }

  const HeaderObj = getHeader(header, body.length)

  return (
    <Flex>
      <Flex mb={1} key={header} flexDirection="row">
        <Box mr={1} mt={0.5}>
          {HeaderObj.IconComponent}
        </Box>
        <Flex>
          <Text>{HeaderObj.text}</Text>
          {uniq(body).map((b) => (
            <Text key={b} color="black60">
              {b}
            </Text>
          ))}
        </Flex>
      </Flex>
    </Flex>
  )
}
