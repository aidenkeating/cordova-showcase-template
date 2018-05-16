import { Component } from '@angular/core';
import { NavController, ToastController } from 'ionic-angular';
import { SecurityService, SecurityCheck, SecurityCheckType, SecurityCheckResult } from '@aerogear/security';
import { SecurityCheckResultMetric } from '@aerogear/security';

declare let device: any;

@Component({
  selector: 'page-deviceTrust',
  templateUrl: 'deviceTrust.html'
})
export class DeviceTrustPage {
  detections: Array<{label: string, detected: boolean}>;
  trustScore: number;
  totalTests: number;
  totalDetections: number;
  securityService: SecurityService;

  constructor(public navCtrl: NavController, private toastCtrl: ToastController) {
    this.detections = [];
    this.trustScore = 0.0;
    this.totalTests = 0;
    this.totalDetections = 0;
    this.securityService = new SecurityService();
  }

  performChecks() {
    this.detectRoot(); 
    this.detectEmulator();
    this.detectDebug();
    this.detectLatestOS();
    this.detectDeviceLock();
  }

  performChecksAndPublishMetrics(): Promise<SecurityCheckResult[]> {
    return this.securityService.checkManyAndPublishMetric(SecurityCheckType.notDebugMode,
      SecurityCheckType.notRooted,
      SecurityCheckType.notEmulated,
      SecurityCheckType.hasDeviceLock);
  }

  addDetection(label: string, isSecure: boolean) {
    this.totalTests++;

    if(!isSecure) {
      this.totalDetections++;
    }

    this.detections.push({label: label, detected: isSecure});
    this.trustScore = (100 - (((this.totalDetections / this.totalTests) * 100)));
  }

  // tag::detectEmulator[]
  /**
  * Detect if the device is running on an emulator.
  */
  detectEmulator(): void {
    this.securityService.check(SecurityCheckType.notEmulated)
      .then((isEmulated: SecurityCheckResult) => {
        const emulatedMsg = isEmulated.passed ? "Emulator Not Detected" : "Emulator Detected";
        this.addDetection(emulatedMsg, isEmulated.passed)
      }).catch((err: Error) => this.displayCheckError(SecurityCheckType.notEmulated, err));
  }
  // end::detectEmulator[]

  // tag::detectRoot[]
  /**
  * Detect if the device is running Root.
  */
  detectRoot(): void {
    this.securityService.check(SecurityCheckType.notRooted)
      .then((isRooted: SecurityCheckResult) => {
        const rootedMsg = isRooted.passed ? "Root Access Not Detected" : "Root Access Detected";
        this.addDetection(rootedMsg, isRooted.passed);
      }).catch((err: Error) => this.displayCheckError(SecurityCheckType.notRooted, err));
  }
  // end::detectRoot[]

  // tag::detectDebug[]
  /**
  * Detect if the app is running in debug mode.
  */
  detectDebug(): void {
    this.securityService.check(SecurityCheckType.notDebugMode)
      .then((isDebugger: SecurityCheckResult) => {
        const debuggerMsg = isDebugger.passed ? "Debug Mode Not Detected" : "Debug Mode Detected";
        this.addDetection(debuggerMsg, isDebugger.passed);
      }).catch((err: Error) => this.displayCheckError(SecurityCheckType.notDebugMode, err));
  }
  // end::detectDebug[]

  // tag::detectLatestOS[]
  /**
  * Detect if the device is running the latest version of Android and iOS.
  */
  detectLatestOS() {
    var platform = device.platform;
    var deviceVersion = device.version;

    if(platform === "Android") {
      var latestAndroidVersion = 8.0;
      if (deviceVersion < latestAndroidVersion) {
        this.addDetection("Outdated OS Version Detected", true);
      } else {
        this.addDetection("Latest OS Version Detected", false);
      }
    } else if(platform === "iOS") {
      var latestIosVersion = 11.0;
      if (deviceVersion < latestIosVersion) {
        this.addDetection("Outdated OS Version Detected", true);
      } else {
        this.addDetection("Latest OS Version Detected", false);
      }
    }
  }
  // end::detectLatestOS[]

  // tag::detectDeviceLock[]
  /**
  * Detect if a system device lock is set.
  */
  detectDeviceLock() {
    this.securityService.check(SecurityCheckType.hasDeviceLock)
      .then((deviceLockEnabled: SecurityCheckResult) => {
        const deviceLockMsg = deviceLockEnabled.passed ? "Device Lock Detected" : "Device Lock Not Detected";
        this.addDetection(deviceLockMsg, deviceLockEnabled.passed);
      }).catch((err: Error) => this.displayCheckError(SecurityCheckType.hasDeviceLock, err));
  }
  // end::detectDeviceLock[]

  ionViewDidEnter(): void {
    this.performChecks();
    this.performChecksAndPublishMetrics()
      .then((results: SecurityCheckResultMetric[]) => this.toastCtrl.create({
        message: `${results.length} metrics were sent successfully`,
        duration: 3000,
        dismissOnPageChange: true
      }).present())
      .catch(error => this.toastCtrl.create({
        message: `An error occurred while sending metrics: ${error}`,
        duration: 2000,
        dismissOnPageChange: true
      }).present());
  }

  private displayCheckError(check: SecurityCheck, err: Error): void {
    this.toastCtrl.create({
      message: `Error running check ${check.name}: ${err.message}`,
      duration: 3000,
      dismissOnPageChange: true
    }).present();
  }
}
