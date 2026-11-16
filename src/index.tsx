// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let google: any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let window: any
import { useEffect, useState } from 'react'
import {
  authResult,
  defaultConfiguration,
  PickerConfiguration,
} from './typeDefs'
import useInjectScript from './useInjectScript'

export default function useDrivePicker(): [
  (config: PickerConfiguration) => boolean | undefined,
  authResult | undefined
] {
  const defaultScopes = ['https://www.googleapis.com/auth/drive.file']
  const [loaded, error] = useInjectScript('https://apis.google.com/js/api.js')
  const [loadedGsi, errorGsi] = useInjectScript(
    'https://accounts.google.com/gsi/client'
  )
  const [pickerApiLoaded, setpickerApiLoaded] = useState(false)
  const [openAfterAuth, setOpenAfterAuth] = useState(false)
  const [config, setConfig] =
    useState<PickerConfiguration>(defaultConfiguration)
  const [authRes, setAuthRes] = useState<authResult>()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let picker: any

  // load the Google APIs
  useEffect(() => {
    if (loaded && !error && loadedGsi && !errorGsi && !pickerApiLoaded) {
      loadApis()
    }
  }, [loaded, error, loadedGsi, errorGsi, pickerApiLoaded])

  // effect to open picker after auth
  useEffect(() => {
    if (
      openAfterAuth &&
      config.token &&
      loaded &&
      !error &&
      loadedGsi &&
      !errorGsi &&
      pickerApiLoaded
    ) {
      createPicker(config)
      setOpenAfterAuth(false)
    }
  }, [
    openAfterAuth,
    config.token,
    loaded,
    error,
    loadedGsi,
    errorGsi,
    pickerApiLoaded,
  ])

  // open the picker
  const openPicker = (config: PickerConfiguration) => {
    setConfig(config)

    // If we don't have an access token, initialize the OAuth token client with new requirements
    if (!config.token) {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: config.clientId,
        scope: (config.customScopes
          ? [...defaultScopes, ...config.customScopes]
          : defaultScopes
        ).join(' '),
        // Launch OAuth exclusively via redirect in standard browser environment (not embedded webview)
        ux_mode: config.uxMode || 'popup', 
        callback: (tokenResponse: authResult) => {
          setAuthRes(tokenResponse)
          createPicker({ ...config, token: tokenResponse.access_token })
        },
      })

      // Request access token with prompt=consent and trigger_onepick=true
      client.requestAccessToken({
        prompt: 'consent',
        trigger_onepick: 'true',
      })
      return
    }

    // If token exists and API loaded, create picker directly
    if (config.token && loaded && !error && pickerApiLoaded) {
      return createPicker(config)
    }
  }

  // load the Drive picker API
  const loadApis = () => {
    if (window.gapi) {
      window.gapi.load('picker', { callback: onPickerApiLoad })
    }
  }

  const onPickerApiLoad = () => {
    setpickerApiLoaded(true)
  }

  const createPicker = ({
    token,
    appId,
    supportDrives = false,
    developerKey,
    viewId = 'DOCS',
    disabled,
    multiselect,
    setOrigin,
    showUploadView = false,
    showUploadFolders,
    setParentFolder = '',
    viewMimeTypes,
    customViews,
    locale = 'en',
    setIncludeFolders,
    setSelectFolderEnabled,
    disableDefaultView = false,
    callbackFunction,
  }: PickerConfiguration) => {
    if (disabled) return false

    const view = new google.picker.DocsView(google.picker.ViewId[viewId])
    if (viewMimeTypes) view.setMimeTypes(viewMimeTypes)
    if (setIncludeFolders) view.setIncludeFolders(true)
    if (setSelectFolderEnabled) view.setSelectFolderEnabled(true)

    const uploadView = new google.picker.DocsUploadView()
    if (viewMimeTypes) uploadView.setMimeTypes(viewMimeTypes)
    if (showUploadFolders) uploadView.setIncludeFolders(true)
    if (setParentFolder) uploadView.setParent(setParentFolder)
    if (setParentFolder) view.setParent(setParentFolder)

    picker = new google.picker.PickerBuilder()
      .setAppId(appId)
      .setOAuthToken(token)
      .setDeveloperKey(developerKey)
      .setLocale(locale)
      .setCallback(callbackFunction)

    if (setOrigin) {
      picker.setOrigin(setOrigin)
    }

    if (!disableDefaultView) {
      picker.addView(view)
    }

    if (customViews) {
      customViews.forEach((view: any) => picker.addView(view))
    }

    if (multiselect) {
      picker.enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
    }

    if (showUploadView) picker.addView(uploadView)

    if (supportDrives) {
      picker.enableFeature(google.picker.Feature.SUPPORT_DRIVES)
    }

    picker.build().setVisible(true)
    return true
  }

  return [openPicker, authRes]
}