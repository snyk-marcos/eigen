import { scaleLinear, scaleQuantile } from "d3-scale"
import * as shape from "d3-shape"
import { compact } from "lodash"
import { Flex } from "palette"
import { useColor, useSpace } from "palette/hooks"
import { StarCircleIcon } from "palette/svgs/StarCircleIcon"
import { Color } from "palette/Theme"
import React, { useCallback, useEffect, useRef, useState } from "react"
import { Dimensions, Platform, StyleSheet } from "react-native"
import {
  HandlerStateChangeEventPayload,
  LongPressGestureHandler,
  PanGestureHandler,
  State,
  TapGestureHandler,
  TapGestureHandlerEventPayload,
} from "react-native-gesture-handler"
import Animated, {
  call,
  Extrapolate,
  useAnimatedStyle,
  useCode,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import Svg, { Defs, G, LinearGradient, Path, Stop } from "react-native-svg"
import { Subject } from "rxjs"
import * as pathProperties from "svg-path-properties"
import { AnimatePropTypeInterface, InterpolationPropType } from "victory-core"
import {
  VictoryArea,
  VictoryAxis,
  VictoryChart,
  VictoryLine,
  VictoryScatter,
  VictoryTheme,
} from "victory-native"
import { Text } from "../Text"
import { Axes, XAxisLabels, YAxisLabels } from "./Axes"
import { AxisDisplayType, randomSVGId, shadeColor, tickFormat } from "./helpers"
import { ScatterChart } from "./ScatterChart"
import {
  HighlightIconContainer,
  ScatterChartPointProps,
  ScatterDataPointContainer,
} from "./ScatterPointsContainers"
import { LineChartData } from "./types"

export type ChartTapEventType = HandlerStateChangeEventPayload & TapGestureHandlerEventPayload

// using Subject because this observable should multicast to many datapoints
export const ChartTapObservable = new Subject<ChartTapEventType>()

interface LineGraphChartProps extends LineChartData {
  chartHeight?: number
  chartWidth?: number
  chartInterpolation?: InterpolationPropType
  onDataPointPressed?: (datum: LineChartData["data"][0] | null) => void
  onXHighlightPressed?: (datum: { _x: number; _y: number; x: number; y: number }) => void
  onYHighlightPressed?: (datum: { _x: number; _y: number; x: number; y: number }) => void
  shouldAnimate?: boolean
  showHighlights?: boolean
  showOnlyActiveDataPoint?: boolean
  /** Specifies by what factor between -0 to +1 to shade the graph area. Positive values lightens, negative darkens */
  tintColorShadeFactor?: number
  xAxisTickFormatter?: (val: any) => string
  yAxisTickFormatter?: (val: any) => string
  xAxisDisplayType?: AxisDisplayType
  yAxisDisplayType?: AxisDisplayType
}

const { width: deviceWidth, height: deviceHeight } = Dimensions.get("window")

export const LineGraphChart: React.FC<LineGraphChartProps> = ({
  data,
  dataMeta: { tintColor = "#707070", xHighlightIcon },
  chartHeight = deviceHeight / 3,
  chartWidth = deviceWidth - 20 * 2,
  chartInterpolation = "natural",
  onDataPointPressed,
  onXHighlightPressed,
  shouldAnimate = true,
  showHighlights = false,
  showOnlyActiveDataPoint,
  tintColorShadeFactor = 0.8,
  xAxisTickFormatter,
  yAxisTickFormatter,
  xAxisDisplayType,
  yAxisDisplayType,
}) => {
  const color = useColor()

  const shadedTintColor = shadeColor(tintColor, tintColorShadeFactor)

  const xHighlights = compact(
    data.map((datum) => (datum.highlight?.x ? { y: 0, x: datum.x } : null))
  )

  const yHighlights = compact(
    data.map((datum) => (datum.highlight?.y ? { x: 0, y: datum.y } : null))
  )

  useEffect(() => {
    if (yHighlights.length && showHighlights) {
      console.error("Plotting highlights on dependent axis Y is not yet supported")
    }
  }, [yHighlights])

  const yValues = data.map((datum) => datum.y)
  const xValues = data.map((datum) => datum.x)

  const datapointsByX: { [key: typeof data[0]["x"]]: typeof data[0] } = Object.assign(
    {},
    ...data.map((d) => ({ [d.x]: d }))
  )

  const minMaxDomainY = { min: Math.min(...yValues), max: Math.max(...yValues) }
  const minMaxDomainX = { min: Math.min(...xValues), max: Math.max(...xValues) }

  const maxima = minMaxDomainY.max // because the y axis is the dependent axis

  // If you using the chart interpolation to natural, you need
  // the right domainPadding so that the parabolic curve at the
  // top is not cut off
  const yDomainPadding =
    chartInterpolation === "natural" ? calculateDomainPadding(yValues, maxima) : 0

  const xAxisTickMap: Record<number, boolean> = Object.assign(
    {},
    ...xValues.map((xtick) => ({ [xtick]: true }))
  )

  const renderDefs = useCallback(
    () => (
      <Defs>
        <LinearGradient id="gradientStroke" gradientTransform="rotate(90)">
          <Stop offset="0%" stopColor={shadedTintColor} stopOpacity="20%" />
          <Stop offset="100%" stopColor="white" />
        </LinearGradient>
      </Defs>
    ),
    [tintColor]
  )

  const ANIMATION_CONFIG: AnimatePropTypeInterface = {
    duration: 750,
    onExit: {
      duration: 750,
      before: (datum) => ({
        ...datum,
        _y: 0,
        _x: minMaxDomainX.max,
      }),
    },
    onEnter: {
      duration: 750,
      before: (datum) => ({
        ...datum,
        _y: 0,
        _x: minMaxDomainX.max,
      }),
    },
    onLoad: {
      duration: 750,
      before: (datum) => ({
        ...datum,
      }),
    },
    easing: "linear",
  }

  const space = useSpace()

  const broadcastTapEventXToDataPoints = (event: ChartTapEventType) => {
    ChartTapObservable.next(event)
  }

  const d3 = {
    shape,
  }

  const [rerender, setRerender] = useState(false)

  const forceRerender = () => setRerender(!rerender)

  useEffect(() => {
    forceRerender()
  }, [data.length])

  // tslint:disable-next-line:array-type
  const ourData: [number, number][] = data.map((d) => [d.x, d.y])

  const scaleX = scaleLinear().domain([minMaxDomainX.min, minMaxDomainX.max]).range([0, chartWidth])

  const scaleY = scaleLinear()
    .domain([minMaxDomainY.min, minMaxDomainY.max])
    .range([chartHeight, 0])

  const lineChart =
    d3.shape
      .line()
      .y((d) => scaleY(d[1]))
      .x((d) => scaleX(d[0]))
      .curve(d3.shape.curveMonotoneX)(ourData) ?? undefined

  const movingLine =
    d3.shape
      .line()
      .x((d) => d[0])
      .y((d) => scaleY(d[1]))(yValues.map((t) => [0, t])) ?? undefined

  const properties = pathProperties.svgPathProperties(lineChart!)
  const lineLength = properties.getTotalLength()

  const scaleLabels = xValues.sort((a, b) => b - a)
  const scaleXLabel = scaleQuantile()
    .domain([minMaxDomainX.min, minMaxDomainX.max])
    .range(scaleLabels)

  const [scrollX] = useState(new Animated.Value(0))

  const styles = makeStyles(chartHeight, chartWidth)

  const [yLabelMaxWidth, setYLabelMaxWidth] = useState(0)
  const svgLeftMargin = yLabelMaxWidth + 5
  const scaleFactor = 1 - svgLeftMargin / chartWidth
  const yLabelContainerHeight = chartWidth - chartWidth * (1 - scaleFactor)

  const xLabeltranslateX = scrollX.interpolate({
    inputRange: [0, lineLength],
    outputRange: [chartWidth - svgLeftMargin, 0],
    extrapolate: Extrapolate.CLAMP,
  })

  const activeDataPointOpacity = useSharedValue<0 | 1>(0)

  const activeOpacityStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(activeDataPointOpacity.value, { duration: 500 }),
    }
  })

  const onInteraction = (active: boolean) => {
    activeDataPointOpacity.value = active ? 1 : 0
    if (!active) {
      onDataPointPressed?.(null)
      setSelectedDataPoint(undefined)
    }
  }

  const [labelText, setLabelText] = useState("")
  const [selectedDataPoint, setSelectedDataPoint] = useState<typeof data[0] | undefined>(undefined)
  const [lastPressedPoint, setLastPressedPoint] = useState<ScatterChartPointProps["point"] | null>(
    null
  )

  const showXLabel = (scrollValX: number) => {
    // Note that we pass scrollValX / 2 to the scaleX.invert function
    // because the width of the scrollview is 2x the lineHeight
    const label = scaleXLabel(scaleX.invert(scrollValX / 2))
    setLabelText(label.toString())
  }

  const [movingLinePositionX, setMovingLinePositionX] = useState<number | undefined>(undefined)

  const showMovingLine = (scrollValX: number) => {
    // Note that we pass scrollValX / 2 to the scaleX.invert function
    // because the width of the scrollview is 2x the lineHeight
    const label = scaleXLabel(scaleX.invert(scrollValX / 2))
    setMovingLinePositionX(xGridPositions[label])
    setSelectedDataPoint(datapointsByX[label])
    onDataPointPressed?.(datapointsByX[label])
  }

  const onDataPointAreaTapped = (point: ScatterChartPointProps["point"]) => {
    onInteraction(true)
    const label = point.datum.x
    setSelectedDataPoint(datapointsByX[label])
    setLabelText(label.toString())
    setMovingLinePositionX(xGridPositions[label])
    setLastPressedPoint(point)
    onDataPointPressed?.(datapointsByX[label])
  }

  const [xGridPositions, setXGridPositions] = useState<Record<number, number>>({})

  useCode(() => {
    return call([scrollX], (scrollValueX) => {
      showXLabel(scrollValueX[0])
      showMovingLine(scrollValueX[0])
    })
  }, [scrollX])

  return (
    <Flex marginTop={30}>
      <Svg id={randomSVGId()} width={chartWidth} height={chartHeight}>
        <G id={randomSVGId()} x={svgLeftMargin} scale={scaleFactor}>
          <Defs>
            <LinearGradient x1="50%" y1="0%" x2="50%" y2="100%" id="gradient">
              <Stop stopColor={shadedTintColor} offset="0%" />
              <Stop stopColor={shadeColor(shadedTintColor, 0.95)} offset="80%" />
              <Stop stopColor="white" offset="100%" />
            </LinearGradient>
          </Defs>
          <Path
            id={randomSVGId()}
            d={lineChart}
            fill="transparent"
            stroke={tintColor}
            strokeWidth={2}
          />
          <Path
            id={randomSVGId()}
            d={`${lineChart} L ${chartWidth} ${chartHeight} L 0 ${chartHeight}`}
            fill="url(#gradient)"
          />

          <ScatterChart
            data={data}
            chartHeight={chartHeight}
            chartWidth={chartWidth}
            onDataPointAreaTapped={onDataPointAreaTapped}
            showOnlyActiveDataPoint={showOnlyActiveDataPoint}
            selectedDataPoint={selectedDataPoint}
            tintColor={activeDataPointOpacity.value ? tintColor : "transparent"}
            xDomain={[minMaxDomainX.min, minMaxDomainX.max]}
            yDomain={[minMaxDomainY.min, minMaxDomainY.max]}
          />
          <Axes
            chartWidth={chartWidth}
            chartHeight={chartHeight}
            xDomain={[minMaxDomainX.min, minMaxDomainX.max]}
            yDomain={[minMaxDomainY.min, minMaxDomainY.max]}
            xGridPositionCallback={(val) => {
              // const newState = xGridPositions
              // const key = Object.keys(val)[0]
              // newState[parseInt(key, 10)] = Object.values(val)[0]
              // setXGridPositions(newState)
            }}
            xtickValues={xValues}
            ytickValues={yValues}
            yLabelMaxWidth={svgLeftMargin}
          />

          <Path
            id={randomSVGId()}
            d={movingLine}
            fill="transparent"
            stroke={activeDataPointOpacity.value ? color("black100") : "transparent"}
            strokeDasharray={[4, 4]}
            strokeWidth={1}
            x={movingLinePositionX}
          />
        </G>
      </Svg>

      <YAxisLabels
        height={yLabelContainerHeight}
        onLayout={({ nativeEvent }) => {
          setYLabelMaxWidth(nativeEvent.layout.width)
        }}
        formatter={yAxisTickFormatter}
        yValues={yValues}
        style={{ position: "absolute", top: -5 }}
        labelFormatType={yAxisDisplayType}
      />

      <Flex left={yLabelMaxWidth - 5}>
        <XAxisLabels
          width={chartWidth - svgLeftMargin}
          formatter={xAxisTickFormatter}
          xValues={xValues}
        />
      </Flex>

      <Animated.View
        style={[
          styles.label,
          {
            transform: [{ translateX: xLabeltranslateX }],
            marginLeft: svgLeftMargin - 20,
          },
          activeOpacityStyle,
        ]}
      >
        <Text variant="xs">{labelText}</Text>
      </Animated.View>

      <Animated.ScrollView
        style={StyleSheet.absoluteFill}
        onScrollBeginDrag={() => {
          onInteraction(true)
        }}
        onMomentumScrollEnd={() => {
          onInteraction(false)
        }}
        // snapToOffsets={Object.values(xGridPositions)}
        contentContainerStyle={{ width: lineLength * 2 }}
        showsHorizontalScrollIndicator
        scrollEventThrottle={16}
        bounces={false}
        onScroll={Animated.event(
          [
            {
              nativeEvent: {
                contentOffset: { x: scrollX },
              },
            },
          ],
          { useNativeDriver: true }
        )}
        horizontal
      />
    </Flex>
  )

  return (
    <>
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View>
          <TapGestureHandler
            onHandlerStateChange={({ nativeEvent }) => {
              if (nativeEvent.state === State.BEGAN) {
                broadcastGestureEventXToDataPoints(nativeEvent)
                setLastPressedLocation({
                  locationX: nativeEvent.x,
                  locationY: nativeEvent.y,
                })
              } else if (nativeEvent.state === State.END) {
                updateLastPressedDatum(null)
              }
            }}
          >
            <Animated.View>
              <LongPressGestureHandler
                onHandlerStateChange={({ nativeEvent }) => {
                  if (nativeEvent.state === State.END || nativeEvent.state === State.FAILED) {
                    updateLastPressedDatum(null)
                  }
                }}
              >
                <Animated.View>
                  <VictoryChart
                    theme={VictoryTheme.material}
                    // mapping domain from 0 to 1 because data is normalized by the factor of max Y value.
                    domain={{ y: [0, 1] }}
                    domainPadding={{ y: [40, yDomainPadding] }}
                    backgroundComponent={<Background />}
                    containerComponent={<Svg />}
                    style={{
                      background: { fill: "white" },
                    }}
                    padding={{ left: space(3), right: space(1), bottom: space(3), top: space(3) }}
                    width={chartWidth}
                    height={chartHeight}
                  >
                    {renderDefs()}

                    {data.length > 1 && (
                      /** Draws the Area beneath the line.
                       * Will crash on android if you pass data with less than 2 points
                       */
                      <VictoryArea
                        style={{
                          data: { fill: "url(#gradientStroke)" },
                        }}
                        data={data}
                        animate={shouldAnimate ? ANIMATION_CONFIG : undefined}
                        interpolation={chartInterpolation}
                        // Normalise the dependent axis Y. Else it is not possible to represent data with extreme variance.
                        y={(datum: any) => datum.y / maxima}
                      />
                    )}

                    {data.length > 1 && (
                      /** Draws the Line Above the Area
                       * Will crash on android if you pass data with less than 2 points
                       */
                      // @ts-ignore // AnimatePropTypeInterface has not been typed into VictoryLine yet
                      <VictoryLine
                        animate={shouldAnimate ? ANIMATION_CONFIG : undefined}
                        style={{
                          data: { stroke: tintColor },
                          border: { stroke: "transparent" },
                        }}
                        data={data}
                        domain={{ y: [0, 1] }}
                        // groupComponent={<G />} ensures the line is not cut off below when using
                        // chartInterpolation = natural. Without this, lines will dip off
                        // the chart.
                        groupComponent={<G />}
                        interpolation={chartInterpolation}
                        // Normalise the dependent axis Y. Else it is not possible to represent data with extreme variance.
                        y={(datum: any) => datum.y / maxima}
                      />
                    )}

                    {/** Y-Axis */}
                    <VictoryAxis
                      dependentAxis
                      style={{
                        axis: { stroke: color("black30"), strokeDasharray: 2 },
                        ticks: { size: 0 },
                        grid: {
                          stroke: ({ tick }: { tick: number }) =>
                            Number(tick * maxima) === minMaxDomainY.max
                              ? color("black30")
                              : "transparent",
                          strokeDasharray: 3,
                        },
                      }}
                      axisLabelComponent={<Text />}
                      maxDomain={minMaxDomainY.max}
                      minDomain={minMaxDomainY.min}
                      tickFormat={(tick: number) =>
                        tickFormat(
                          tick * maxima, // Because we did y={(datum) => datum.y / maxima} in VictoryArea to normalise Y values
                          minMaxDomainY.min,
                          minMaxDomainY.max,
                          yAxisTickFormatter, // falls back to use the defaultFormatter
                          yAxisDisplayType ?? AxisDisplayType.OnlyShowMinAndMaxDomain
                        )
                      }
                    />

                    {/** X-Axis */}
                    <VictoryAxis
                      crossAxis
                      style={{
                        axis: { stroke: color("black30"), strokeDasharray: 2 },
                        ticks: { size: 0 },
                        grid: {
                          stroke: ({ tick }: { tick: number }) => {
                            if (tick === lastPressedDatum?.x) {
                              return color("black100")
                            }
                            if (xValues.length > 1) {
                              return xAxisTickMap[tick] ? color("black30") : "transparent"
                            }
                            return color("black30")
                          },
                          strokeDasharray: 3,
                        },
                      }}
                      tickValues={xValues}
                      axisLabelComponent={<Text />}
                      maxDomain={minMaxDomainX.max}
                      minDomain={minMaxDomainX.min}
                      tickFormat={(tick: number) =>
                        tickFormat(
                          tick,
                          minMaxDomainX.min,
                          minMaxDomainX.max,
                          xAxisTickFormatter ?? ((val) => val), // don't format x ticks by default
                          xAxisDisplayType ?? AxisDisplayType.OnlyShowMinAndMaxDomain
                        )
                      }
                    />

                    {/** If only a single data is given, plot a point */}
                    <VictoryScatter
                      style={{
                        data: {
                          stroke: tintColor,
                          fill: ({ datum }: { datum: any }) =>
                            datum.x === lastPressedDatum?.x || data.length === 1
                              ? tintColor
                              : "transparent",
                        },
                      }}
                      data={data}
                      domain={{ y: [0, 1] }}
                      y={(datum: any) => datum.y / maxima}
                      dataComponent={
                        <ScatterDataPointContainer
                          // touch along the x axis within this radius, the data point within this radius can claim it
                          pointXRadiusOfTouch={pointXRadiusOfTouch}
                          size={4}
                          setLastPressedDatum={setLastPressedDatum}
                          onDataPointPressed={onDataPointPressed}
                          lastPressedLocation={lastPressedLocation}
                          clearLastPressedLocation={() => setLastPressedLocation(null)}
                        />
                      }
                    />

                    {/*
                     * If you include xHighlight values in your data, the
                     * values will be plotted along the x-axis as highlights
                     */}
                    {!!showHighlights && !!xHighlights.length && (
                      <VictoryScatter
                        name="xHighlightsChart"
                        animate={ANIMATION_CONFIG}
                        style={{
                          data: { stroke: tintColor, fill: tintColor },
                          parent: { border: "transparent" },
                        }}
                        data={xHighlights}
                        size={Platform.OS === "android" ? 7 : 5}
                        dataComponent={
                          <HighlightIconContainer
                            icon={
                              xHighlightIcon ?? (
                                <StarCircleIcon fill={tintColor as Color} height={20} width={20} />
                              )
                            }
                            onHighlightPressed={onXHighlightPressed}
                            lastPressedLocation={lastPressedLocation}
                            clearLastPressedLocation={() => setLastPressedLocation(null)}
                          />
                        }
                      />
                    )}
                  </VictoryChart>
                </Animated.View>
              </LongPressGestureHandler>
            </Animated.View>
          </TapGestureHandler>
        </Animated.View>
      </PanGestureHandler>

      {lastPressedDatum && (
        <Flex position="absolute" top={70} left={lastPressedDatum?.left}>
          <Text textAlign="center" variant="xs" color="black60">
            {lastPressedDatum.x}
          </Text>
        </Flex>
      )}
    </>
  )
}

const Background = (props: any) => (
  <Flex
    position="absolute"
    width={props.width}
    height={props.height}
    left={props.x}
    top={props.y}
  />
)

/** Calculates the appropriate domain padding to apply to the top bound of the y axis.
 * Because we set interpolation natural, the Area or LineChart will have a parabolic curve
 * at the highest point as it connects to the next point if the next point falls within the
 * same plane as the highest point. Without domain padding to the top,the parabolic curve
 * will be cut off from the chart.
 */
const calculateDomainPadding = (values: number[], maxima: number): number => {
  const gridBoxHeight = maxima / 5
  let padding = 0
  const l = values.length
  for (let i = 0; i < l; i++) {
    if (i <= l - 2) {
      const currValue = values[i]
      const nextValue = values[i + 1]
      if (currValue === maxima && currValue - nextValue <= gridBoxHeight) {
        // needs padding
        const f = gridBoxHeight / 5 // because each micro box in a gridbox is 5
        const factor = (maxima + "").length
        padding = (f / Math.pow(10, factor)) * Math.pow(10, 3)
        break
      }
    }
  }
  return padding
}

const makeStyles = (height: number, width: number) =>
  StyleSheet.create({
    root: {
      flex: 1,
    },
    container: {
      marginTop: 60,
      height,
      width,
    },

    label: {
      position: "absolute",
      top: -20,
      left: 0,
      width: 60,
    },
  })
