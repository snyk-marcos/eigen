import { MyCollectionArtworkAboutWork_artwork$key } from "__generated__/MyCollectionArtworkAboutWork_artwork.graphql"
import { MyCollectionArtworkAboutWork_marketPriceInsights$key } from "__generated__/MyCollectionArtworkAboutWork_marketPriceInsights.graphql"
import { formatCentsToDollars } from "app/Scenes/MyCollection/utils/formatCentsToDollars"
import { useFeatureFlag } from "app/store/GlobalStore"
import { capitalize } from "lodash"
import { Flex, Text } from "palette"
import { graphql, useFragment } from "react-relay"
import { Field } from "../Field"

interface EstimatePriceType {
  lowRangeCents: number | null
  highRangeCents: number | null
}

interface MyCollectionArtworkAboutWorkProps {
  artwork: MyCollectionArtworkAboutWork_artwork$key
  marketPriceInsights: MyCollectionArtworkAboutWork_marketPriceInsights$key | null
}

export const MyCollectionArtworkAboutWork: React.FC<MyCollectionArtworkAboutWorkProps> = (
  props
) => {
  const artwork = useFragment(artworkFragment, props.artwork)
  const marketPriceInsights = useFragment(marketPriceInsightsFragment, props.marketPriceInsights)

  const enablePriceEstimateRange = useFeatureFlag("AREnablePriceEstimateRange")

  const { category, medium, dimensions, date, provenance, metric } = artwork

  // FIXME: types of these values are unknown (coming from MP), so it needs to be casted to Number to work properly here
  const estimatePrice = getEstimatePrice({
    lowRangeCents: Number(marketPriceInsights?.lowRangeCents),
    highRangeCents: Number(marketPriceInsights?.highRangeCents),
  })

  return (
    <Flex mb={4}>
      <Text variant="sm-display" my={1}>
        About the work
      </Text>
      {!!enablePriceEstimateRange && <Field label="Estimate Range" value={estimatePrice} />}
      <Field label="Medium" value={capitalize(category!)} />
      <Field label="Materials" value={capitalize(medium!)} />
      <Field label="Dimensions" value={(metric === "in" ? dimensions?.in : dimensions?.cm) || ""} />
      <Field label="Year created" value={date} />
      <Field label="Provenance" value={provenance} />
    </Flex>
  )
}

const artworkFragment = graphql`
  fragment MyCollectionArtworkAboutWork_artwork on Artwork {
    category
    medium
    metric
    dimensions {
      in
      cm
    }
    date
    provenance
  }
`

const marketPriceInsightsFragment = graphql`
  fragment MyCollectionArtworkAboutWork_marketPriceInsights on MarketPriceInsights {
    lowRangeCents
    highRangeCents
  }
`

export const getEstimatePrice = ({ lowRangeCents, highRangeCents }: EstimatePriceType) => {
  if (!lowRangeCents || !highRangeCents) {
    return ""
  }

  return `${formatCentsToDollars(lowRangeCents)} - ${formatCentsToDollars(highRangeCents)}`
}
