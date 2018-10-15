// com.webos.settingsservice -- available on TV devices, not in OSE.
// http://webostv.developer.lge.com/api/webos-service-api/settings-service/

const Service = require('./ServiceStub');
const service = new Service('com.webos.settingsservice');

const systemSettings = {
    network: {
        deviceName: 'WEBOS',
        wolwowlOnOff: false,
        bleAdvertisingOnOff: 'off',
        allowMobileDeviceAccess: false,
    },
    option: {
        subdivisionCodeOfServiceCountry: '',
        googleAssistantTTS: 'on',
        _3dModeEstreamer: 'off',
        promotionPeriodEnd: 0,
        storeModeVideo: 'off',
        speakToTv: 'off',
        vsn: 'N/A',
        ismMethod: 'normal',
        audioGuidance: 'off',
        smartServiceCountryCode2: 'US',
        autoSmartServiceCountry: 'on',
        emergencyAlert: 'on',
        pointerShape: 'auto',
        backupPsm: {
            backupPsm2d: 'hdrStandard',
            backupPsm3d: 'hdrStandard',
        },
        country: 'USA',
        IPControlSecureKey: '',
        ibbDnt: 'off',
        virtualSetTop: 'off',
        channelplus: 'off',
        virtualKeyboardLanguage: ['en-US'],
        webOSPromotionVideo: 'on',
        avatar: 'off',
        searchAppTTS: 'off',
        demoMode: 'on',
        addressInfo: [
            'not_defined',
            'not_defined',
            'not_defined',
            'not_defined',
        ],
        hddEcoMode: 'on',
        firstTvSignalStatus: 'undefined', // yes, strings.
        countryRegion: 'other',
        curDemoFile: 'undefined', // string
        demoFileList: 'undefined', // string
        teletextLanguageFirst: 'eng',
        japanCitySelection: 'Tokyo',
        powerOnLight: 'off',
        mhegGuide: 'off',
        audioGuidanceVolume: 'medium',
        orbit: 'off',
        enabling3dSettingsMenu: 'off',
        backupPsmDolby: {
            backupPsm2d: 'dolbyHdrDark',
            backupPsm3d: 'dolbyHdrDark',
        },
        eStreamerPosition: 'all',
        hybridCast: 'off',
        enableIpControl: 'off',
        ohtv: 'on',
        magicNum1: {
            id: '',
            params: {},
        },
        inputDevicesSupportStatus: {
            keyboard: true,
            motionSensor: true,
            pointer: true,
            voice: true,
            touch: false,
        },
        magicNum2: {
            id: '',
            params: {},
        },
        magicNum4: {
            id: '',
            params: {},
        },
        hbbTV: 'off',
        magicNum3: {
            id: '',
            params: {},
        },
        audioGuidancePitch: 'medium',
        magicNum8: {
            id: '',
            params: {},
        },
        bannerPosition: 'none',
        multiViewStatus: 'off',
        additionalAudioSelection: 'none',
        magicNum9: {
            id: '',
            params: {},
        },
        voiceRecognitionLanguage: 'eng',
        pointerSpeed: 'normal',
        freeviewMode: 'off',
        magicNum6: {
            id: '',
            params: {},
        },
        helpOnSettings: 'on',
        localeCountryGroup: 'langSelUS',
        turnOnByVoice: 'off',
        magicNum5: {
            id: '',
            params: {},
        },
        ibb: 'off',
        autoComplete: false,
        setId: '1', // string
        enableSDDP: 'off',
        countryGroup: 'US',
        smartSoundDemo: 'on',
        estreamerStatus: 'off',
        highContrast: 'off',
        smartServiceCountryCode3: 'USA',
        pointerSize: 'medium',
        promotionOriginEnd: 'undefined', // string
        promotionPeriodStart: '0', // string
        logoLight: 'off',
        interactivity: 'off',
        animationGuide: 'on',
        livePlus: 'off',
        modeSelectFlag: 'off',
        pointerAlighment: 'off',
        miracastOverlayAdRecovery: 'off',
        supplementaryAudio: 'off',
        phlCitySelection: '0', // string
        channelplusPopup: 'off',
        focusedItemEnlarged: 'off',
        pstreamerUser: 'off',
        irBlaster: 'off',
        dataService: 'mheg',
        promotionORiginStart: 'undefined', // string
        magicNumHelpShow: true,
        hbbTvDnt: 'off',
        magicNum7: {
            id: '',
            params: {},
        },
        standByLight: 'on',
        storeMode2: 'on',
        appInstallDevice: {
            deviceId: '',
            driveId: '',
        },
        usbBuiltInVideo: 'on',
        baloonHelp: 'on',
        enableToastPopup: 'on',
        cicNumber: [
            {
                number: 'none',
                country: 'default',
                shortName: 'default',
                _id: '370d',
            }
        ],
        menuTransparency: 'on',
        miracastOverlayStatus: 'off',
        menuLanguage: 'eng',
        wakeUpword: 'LGTV',
        storeLogo: '0',
        subtitleLanguageSecond: 'eng',
        watchedListCollection: 'on',
        subtitleLanguageFirst: 'eng',
        storeHDR: 'on',
        promotionStreamer: 'off',
        liveMenuLaunched: false,
        motionRecognition: 'off',
        audioGuidanceSpeed: 'medium',
        storeMode: 'home',
        zipcode: 'not_defined',
        quickStartMode: 'off',
        teletextLanguageSecond: 'eng',
    },
    root: {
        localeInfo: {
            locales: {
                UI: 'en-US',
                TV: 'en-US',
                FMT: 'en-US',
                NLP: 'en-US',
                STT: 'en-US',
                AUD: 'en-US',
                AUD2: 'en-US',
            },
            clock: 'locale',
            keyboards: ['en'],
            timezone: '',
        },
    },
};

const getSystemSettings = ({ payload: { category = 'root', keys } = {}, respond }) => {
    const catData = systemSettings[category];
    if (!catData) {
        respond({
            method: 'getSystemSettings',
            returnValue: false,
            errorText: 'There is no matched result from DB',
        });
        return;
    }
    const settings = keys.reduce((acc, key) => {
        acc[key] = catData[key];
        return acc;
    }, {});
    respond({
        subscribed: false,
        category,
        method: 'getSystemSettings',
        settings,
        returnValue: true,
    });
};

module.exports = service.register('/getSystemSettings', getSystemSettings);
