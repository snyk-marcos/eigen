import { SplitFactory } from "@splitsoftware/splitio-react-native"
import { useEffect } from "react"
import Config from "react-native-config"
import { GlobalStore } from "../store/GlobalStore"
import { EXPERIMENT_NAME, experiments } from "./experiments"

let client: SplitIO.IClient

export const useExperiments = () => {
  // Instantiate the SDK
  const factory: SplitIO.ISDK = SplitFactory({
    core: {
      authorizationKey: __DEV__ ? Config.SPLIT_IO_STAGING_API_KEY : Config.SPLIT_IO_PRODUCTION_API_KEY,
      key: GlobalStore.useAppState((store) => store.auth.userID) ?? "not-logged",
    },
  })

  // And get the client instance you'll use
  client = factory.client()

  useEffect(() => {
    client.on(client.Event.SDK_READY, () => {
      GlobalStore.actions.config.experiments.setState({ isReady: true })
    })

    client.on(client.Event.SDK_READY_TIMED_OUT, () => {
      GlobalStore.actions.config.experiments.setState({ isReady: false })
    })
  }, [])
  return
}

export const useTreatment = (treatment: EXPERIMENT_NAME) => {
  const isReady = GlobalStore.useAppState((store) => store.config.experiments.isReady)

  if (isReady) {
    if (!client) {
      return experiments[treatment].fallbackTreatment
    }
    return client.getTreatment(treatment)
  }
  return undefined
}