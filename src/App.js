/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */
import React, {Component} from 'react';
import {YellowBox} from 'react-native';
import CodePush from "react-native-code-push";
import {StackNavigator} from 'react-navigation';
import RouteConfigs from './RouteConfigs'
import './storage/store'

YellowBox.ignoreWarnings(['Warning: isMounted(...) is deprecated', 'Module RCTImageLoader']);


const Navigator = StackNavigator(RouteConfigs, {
        initialRouteName: 'MianTab',
        headerMode: 'float'
    }
);

class App extends Component<{}> {
    constructor() {
        super();
        this.state = {restartAllowed: true};
    }

    componentDidMount() {
        this.syncImmediate();
    }

    codePushStatusDidChange(syncStatus) {
        switch (syncStatus) {
            case CodePush.SyncStatus.CHECKING_FOR_UPDATE:
                this.setState({syncMessage: "正在检查更新"});
                break;
            case CodePush.SyncStatus.DOWNLOADING_PACKAGE:
                this.setState({syncMessage: "正在下载安装包"});
                break;
            case CodePush.SyncStatus.AWAITING_USER_ACTION:
                this.setState({syncMessage: "等待用户操作"});
                break;
            case CodePush.SyncStatus.INSTALLING_UPDATE:
                this.setState({syncMessage: "安装更新包"});
                break;
            case CodePush.SyncStatus.UP_TO_DATE:
                this.setState({syncMessage: "更新完成", progress: false});
                break;
            case CodePush.SyncStatus.UPDATE_IGNORED:
                this.setState({syncMessage: "用户取消更新", progress: false});
                break;
            case CodePush.SyncStatus.UPDATE_INSTALLED:
                this.setState({syncMessage: "安装和更新将在重启应用", progress: false});
                break;
            case CodePush.SyncStatus.UNKNOWN_ERROR:
                this.setState({syncMessage: "发生错误", progress: false});
                break;
        }
    }

    codePushDownloadDidProgress(progress) {
        this.setState({progress});
    }

    getUpdateMetadata() {
        CodePush.getUpdateMetadata(CodePush.UpdateState.RUNNING)
            .then((metadata: LocalPackage) => {
                this.setState({
                    syncMessage: metadata ? JSON.stringify(metadata) : "Running binary version",
                    progress: false
                });
            }, (error: any) => {
                this.setState({syncMessage: "Error: " + error, progress: false});
            });
    }


    /** Update pops a confirmation dialog, and then immediately reboots the app */
    syncImmediate() {
        CodePush.checkForUpdate()
            .then((update) => {
                if (!update) {
                    this.setState({syncMessage: "app是最新版了", progress: false});
                } else {
                    CodePush.sync(
                        {
                            /**
                             * 三种更新的策略: 配置到installMode: 之后即可生效
                             * IMMEDIATE 下载完立即更新APP
                             * ON_NEXT_RESTART 到下一次启动应用时
                             * ON_NEXT_RESUME 当应用从后台返回时
                             */
                            installMode: CodePush.InstallMode.ON_NEXT_RESTART,
                            updateDialog: {
                                optionalIgnoreButtonLabel: '下次再说',
                                optionalInstallButtonLabel: '后台更新',
                                optionalUpdateMessage: '有新版本了，是否更新？',
                                mandatoryContinueButtonLabel: '继续',
                                mandatoryUpdateMessage: '有新版本了，是否更新？',
                                title: '更新提示'
                            }
                        },
                        this.codePushStatusDidChange.bind(this),
                        this.codePushDownloadDidProgress.bind(this)
                    );
                }
            });
    }

    render() {
        /*let progressView;

        if (this.state.progress) {
            progressView = (
                <Text style={styles.messages}>{this.state.progress.receivedBytes} of {this.state.progress.totalBytes}
                    bytes received</Text>
            );
        }*/

        return (
            <Navigator />
        );
    }

}



/**
 * Configured with a MANUAL check frequency for easy testing. For production apps, it is recommended to configure a
 * different check frequency, such as ON_APP_START, for a 'hands-off' approach where CodePush.sync() does not
 * need to be explicitly called. All options of CodePush.sync() are also available in this decorator.
 */
let codePushOptions = {checkFrequency: CodePush.CheckFrequency.MANUAL};

App = CodePush(codePushOptions)(App);

export default App;