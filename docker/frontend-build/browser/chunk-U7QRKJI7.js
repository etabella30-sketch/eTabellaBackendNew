import {
  LoginService
} from "./chunk-WMS43CSS.js";
import {
  InputComponent
} from "./chunk-FEMUAMTL.js";
import {
  SocketService
} from "./chunk-5NC3YOIN.js";
import "./chunk-ZDDERD6Z.js";
import {
  AvatarComponent
} from "./chunk-H74SWAKT.js";
import "./chunk-TNIBXRF4.js";
import "./chunk-BXSF7XA6.js";
import "./chunk-UVEQGFJV.js";
import {
  MatCheckbox,
  MatCheckboxModule
} from "./chunk-QZYXJIJ7.js";
import {
  SecureStorageService
} from "./chunk-42T75ZKA.js";
import {
  FormBuilder,
  FormGroupDirective,
  FormsModule,
  NgControlStatus,
  NgControlStatusGroup,
  NgModel,
  ReactiveFormsModule,
  Validators,
  ɵNgNoValidate
} from "./chunk-CIO7JDBK.js";
import "./chunk-NKPXCEC5.js";
import "./chunk-W3IEBGJA.js";
import {
  BroadcastingService
} from "./chunk-6RMJH3FI.js";
import "./chunk-DXEI33EW.js";
import "./chunk-UA722RUW.js";
import "./chunk-SI4QPUAD.js";
import {
  ButtonComponent
} from "./chunk-4BFWRZ22.js";
import "./chunk-MESCMVD2.js";
import "./chunk-AIKHFB75.js";
import "./chunk-4SC6BA7R.js";
import "./chunk-MLRGQ4I6.js";
import "./chunk-D2JKPWBT.js";
import {
  Router
} from "./chunk-FNSUDMGC.js";
import "./chunk-EVEACXQX.js";
import {
  CommonModule,
  NgIf,
  NgStyle
} from "./chunk-YBHDQMOW.js";
import {
  ElementRef,
  __async,
  ɵsetClassDebugInfo,
  ɵɵProvidersFeature,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵclassMap,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵloadQuery,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵpureFunction0,
  ɵɵpureFunction1,
  ɵɵqueryRefresh,
  ɵɵreference,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIndex,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵsanitizeHtml,
  ɵɵstyleMap,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate2,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty,
  ɵɵviewQuery
} from "./chunk-OLJKHPOW.js";

// src/app/core/authantication/login/login.component.ts
var _c0 = ["parent"];
var _c1 = ["section"];
var _c2 = ["curunttab"];
var _c3 = () => ({ name: "userfill", "dir": "L" });
var _c4 = () => ({ name: "lock", "dir": "L" });
var _c5 = () => ({ standalone: true });
var _c6 = (a0) => ({ "width": a0 });
var _c7 = (a0) => ({ "top": a0 });
function LoginComponent_form_7_h6_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "h6", 26);
    \u0275\u0275text(1, "Invalid username/password. Try again");
    \u0275\u0275elementEnd();
  }
}
function LoginComponent_form_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "form", 17)(1, "h6", 18);
    \u0275\u0275text(2, "Login");
    \u0275\u0275elementEnd();
    \u0275\u0275template(3, LoginComponent_form_7_h6_3_Template, 2, 0, "h6", 19);
    \u0275\u0275elementStart(4, "inpt", 20);
    \u0275\u0275listener("valueChange", function LoginComponent_form_7_Template_inpt_valueChange_4_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.loginForm.controls["cEmail"].setValue($event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "inpt", 21);
    \u0275\u0275listener("valueChange", function LoginComponent_form_7_Template_inpt_valueChange_5_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.loginForm.controls["password"].setValue($event));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "div", 22)(7, "mat-checkbox", 23);
    \u0275\u0275twoWayListener("ngModelChange", function LoginComponent_form_7_Template_mat_checkbox_ngModelChange_7_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r1.keepMeLogin, $event) || (ctx_r1.keepMeLogin = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275text(8, "Keep me signed in");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "span", 24);
    \u0275\u0275text(10, "Forgot username/password?");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(11, "btn", 25);
    \u0275\u0275listener("click", function LoginComponent_form_7_Template_btn_click_11_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onSubmit());
    });
    \u0275\u0275text(12, "Login ");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275property("formGroup", ctx_r1.loginForm);
    \u0275\u0275advance(3);
    \u0275\u0275property("ngIf", ctx_r1.logS.isinvalid);
    \u0275\u0275advance();
    \u0275\u0275property("icon", \u0275\u0275pureFunction0(13, _c3))("value", ctx_r1.loginForm == null ? null : ctx_r1.loginForm.value == null ? null : ctx_r1.loginForm.value.cEmail);
    \u0275\u0275advance();
    \u0275\u0275property("error", ctx_r1.logS.isinvalid)("icon", \u0275\u0275pureFunction0(14, _c4))("isoutside", true)("value", ctx_r1.loginForm == null ? null : ctx_r1.loginForm.value == null ? null : ctx_r1.loginForm.value.password);
    \u0275\u0275advance(2);
    \u0275\u0275twoWayProperty("ngModel", ctx_r1.keepMeLogin);
    \u0275\u0275property("ngModelOptions", \u0275\u0275pureFunction0(15, _c5));
    \u0275\u0275advance(4);
    \u0275\u0275property("disabled", ctx_r1.isloading || ctx_r1.loginForm.status == "INVALID")("isloading", ctx_r1.isloading);
    \u0275\u0275attribute("isdisable", ctx_r1.isloading || ctx_r1.loginForm.status == "INVALID");
  }
}
function LoginComponent_div_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 27);
    \u0275\u0275element(1, "avtr", 28);
    \u0275\u0275elementStart(2, "h6", 29);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "div")(5, "div", 30);
    \u0275\u0275element(6, "div", 31);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "div", 32)(8, "h6", 33);
    \u0275\u0275text(9, "Loading...");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "h6", 34);
    \u0275\u0275text(11);
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("detail", ctx_r1.userdetail);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" Welcome back, ", ctx_r1.userdetail == null ? null : ctx_r1.userdetail.cFname, " ");
    \u0275\u0275advance(3);
    \u0275\u0275property("ngStyle", \u0275\u0275pureFunction1(4, _c6, ctx_r1.currentprogress + "%"));
    \u0275\u0275advance(5);
    \u0275\u0275textInterpolate1("", ctx_r1.currentprogress, "%");
  }
}
function LoginComponent_Conditional_19_For_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 47, 2);
    \u0275\u0275listener("click", function LoginComponent_Conditional_19_For_7_Template_button_click_0_listener() {
      const tab_r5 = \u0275\u0275restoreView(_r4).$implicit;
      const curunttab_r6 = \u0275\u0275reference(1);
      \u0275\u0275nextContext();
      const parent_r7 = \u0275\u0275reference(3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.scrollToSection(tab_r5 == null ? null : tab_r5.id, curunttab_r6, parent_r7));
    });
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const tab_r5 = ctx.$implicit;
    const $index_r8 = ctx.$index;
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275classMap(ctx_r1.activeTab == tab_r5.id ? "!text-blue-on" : "");
    \u0275\u0275property("id", tab_r5.id);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate2(" ", $index_r8 + 1, ". ", tab_r5.name, " ");
  }
}
function LoginComponent_Conditional_19_Conditional_18_For_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 48, 3)(2, "h2", 49);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275element(4, "p", 50);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const section_r10 = ctx.$implicit;
    const $index_r11 = ctx.$index;
    \u0275\u0275property("id", section_r10.id);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate2("", $index_r11 + 1, ". ", section_r10.title, "");
    \u0275\u0275advance();
    \u0275\u0275property("innerHTML", section_r10.content, \u0275\u0275sanitizeHtml);
  }
}
function LoginComponent_Conditional_19_Conditional_18_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275repeaterCreate(0, LoginComponent_Conditional_19_Conditional_18_For_1_Template, 5, 4, "div", 48, \u0275\u0275repeaterTrackByIndex);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275repeater(ctx_r1.sections);
  }
}
function LoginComponent_Conditional_19_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 16)(1, "div", 35);
    \u0275\u0275listener("click", function LoginComponent_Conditional_19_Template_div_click_1_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.showpolicy = false);
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "div", 36, 0)(4, "div", 37);
    \u0275\u0275element(5, "span", 38);
    \u0275\u0275repeaterCreate(6, LoginComponent_Conditional_19_For_7_Template, 3, 5, "button", 39, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "div", 40)(9, "div", 41)(10, "div", 42, 1);
    \u0275\u0275listener("scroll", function LoginComponent_Conditional_19_Template_div_scroll_10_listener() {
      \u0275\u0275restoreView(_r3);
      const scrollContainer_r9 = \u0275\u0275reference(11);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onWindowScroll(scrollContainer_r9));
    });
    \u0275\u0275elementStart(12, "h6", 43);
    \u0275\u0275text(13, "LLOYD MICHAUX (LM) ");
    \u0275\u0275element(14, "br");
    \u0275\u0275text(15, " ACCEPTABLE USE POLICY FOR ");
    \u0275\u0275element(16, "br");
    \u0275\u0275text(17, " eTABELLA SOFTWARE ");
    \u0275\u0275elementEnd();
    \u0275\u0275template(18, LoginComponent_Conditional_19_Conditional_18_Template, 2, 0);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(19, "div", 44)(20, "span", 45);
    \u0275\u0275text(21, "By agreeing, you consent to abide by the terms of the AUP.");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(22, "button", 46);
    \u0275\u0275listener("click", function LoginComponent_Conditional_19_Template_button_click_22_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.isagreed());
    });
    \u0275\u0275text(23, " I agree ");
    \u0275\u0275elementEnd()()()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(5);
    \u0275\u0275styleMap(\u0275\u0275pureFunction1(4, _c7, ctx_r1.activtop + "px"));
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r1.tabs);
    \u0275\u0275advance(12);
    \u0275\u0275conditional(18, (ctx_r1.sections == null ? null : ctx_r1.sections.length) ? 18 : -1);
    \u0275\u0275advance(4);
    \u0275\u0275property("disabled", !ctx_r1.reachedEnd);
  }
}
var LoginComponent = class _LoginComponent {
  constructor(logS, router, formBuilder, socket, ss, broadCast) {
    this.logS = logS;
    this.router = router;
    this.formBuilder = formBuilder;
    this.socket = socket;
    this.ss = ss;
    this.broadCast = broadCast;
    this.showprogress = true;
    this.keepMeLogin = false;
    this.isloading = false;
    this.showpolicy = false;
    this.agreed = false;
    this.currentprogress = 0;
    this.getYear = (/* @__PURE__ */ new Date()).getFullYear();
    this.sectionOffsets = [];
    this.activationOffset = 200;
    this.activtop = 40;
    this.reachedEnd = false;
    this.isScrollingFromClick = false;
    this.tabs = [
      { id: "introduction", name: "Introduction" },
      { id: "purpose", name: "Purpose" },
      { id: "scope", name: "Scope" },
      { id: "acceptableUse", name: "Acceptable Use" },
      { id: "prohabit", name: "Prohibited Activities" },
      { id: "userResponsibilities", name: "User Responsibilities" },
      { id: "monitoring", name: "Monitoring and Enforcement" },
      { id: "amendments", name: "Amendments" },
      { id: "reportingViolations", name: "Reporting Violations" }
    ];
    this.sections = [
      { id: "introduction", title: "Introduction", content: ` <p>This Acceptable Use Policy (AUP) outlines the standards for using Lloyd Michaux's eTabella software and related services. All users, including clients, End Users, and other authorized personnel, must comply with this policy to maintain a secure and efficient platform environment, and to protect LM\u2019s business interests and intellectual property (IP).</p>` },
      {
        id: "purpose",
        title: "Purpose",
        content: `<div>
        <p>The purpose of this AUP is to:</p>
        <ul>
            <li>Ensure the integrity, security, and reliability of LM's eTabella software and services.</li>
            <li>Protect LM\u2019s business interests, IP, and proprietary technology from unauthorized use and potential
                threats.</li>
            <li>Safeguard LM, its clients, and End Users from illegal or damaging actions.</li>
            <li>Define acceptable and unacceptable use of LM's eTabella resources.</li>
        </ul>
    </div>
`
      },
      {
        id: "scope",
        title: "Scope",
        content: ` <div>
        <p>This policy applies to all users accessing or using LM's eTabella software and services, including but not limited to:</p>
        <ul>
            <li>Clients</li>
            <li>Client employees, contractors, and authorized personnel</li>
            <li>End Users within the Client\u2019s organization or authorized third parties</li>
        </ul>
    </div>`
      },
      {
        id: "acceptableUse",
        title: "Acceptable Use",
        content: ` <div>
        <p>Users, including End Users (such as Client employees, contractors, legal representatives, and designated
            third-party partners), are expected to:</p>
        <ul>
            <li>Use LM\u2019s eTabella software solely for legitimate business purposes, such as hearing preparation,
                document review, and secure sharing and annotation of materials within designated areas of the platform,
                as governed by the access levels set by the Master Administrator.</li>
            <li>Respect the distinct, secure areas within eTabella, including Client-Only Content in the Client
                My HearingHub (Client HH), Shared Content accessible to authorized users only, and restricted materials
                within the Arbiter My HearingHub (Arbiter HH). Access to these areas is enforced through strict technical
                controls, ensuring that only the designated parties (e.g., Arbiters for Arbiter HH, each client\u2019s team
                for their respective Client HH) can view or interact with specific content. Users are not permitted and
                will be unable to access any My HearingHub or content area beyond their assigned permissions.</li>
            <li>Protect all Confidential and Proprietary Materials: Safeguard all confidential and proprietary content
                hosted on eTabella, including Matter-related Content, Annotated Transcripts, Client-Only Content, and
                Shared Content. All hosted materials must be handled according to LM\u2019s standards.</li>
            <li>Protecting Proprietary Features: The user experience design and functionality, including the document
                annotation system and platform interface, are proprietary to eTabella. These features, developed
                specifically to support and enhance the paperless hearing process, are protected as part of LM\u2019s
                intellectual property and must not be copied, shared, or reproduced in any form. Users must refrain from
                any attempts to replicate, alter, or extract these features for use outside of eTabella, as detailed in
                Part IV, Section 8.3 of Client Agreements.</li>
            <li>Ensure that use of the eTabella platform does not disrupt the experience for other users or interfere
                with LM\u2019s operations, security, or business interests. This includes avoiding any actions that could
                compromise data integrity, overburden system resources, or otherwise detract from the platform\u2019s
                reliability and secure operation.</li>
        </ul>
    </div>`
      },
      {
        id: "prohabit",
        title: "Prohibited Activities",
        content: ` <div>
        <p>To maintain the security, functionality, and integrity of LM\u2019s eTabella platform, users\u2014including End
            Users\u2014are prohibited from engaging in activities that compromise these standards, including but not limited
            to:</p>
        <ul>
            <li>Unauthorized Access: Attempting to access or interfere with accounts, data, or restricted areas within
                the eTabella platform, such as the Arbiter My HearingHub (Arbiter HH), Client My HearingHub (Client HH), or
                any content beyond the user\u2019s designated permissions. Access is strictly limited based on roles and
                permissions assigned by LM.</li>
            <li>Disruption: Introducing or attempting to introduce any viruses, malware, harmful software, or
                unauthorized scripts that could compromise the security, functionality, or performance of the eTabella
                platform. This includes any actions that may disrupt services, alter data, or otherwise impact LM\u2019s
                operational stability.</li>
            <li>Misuse of Resources: Using eTabella to store, transmit, or distribute material that is illegal, harmful,
                offensive, or otherwise poses a risk to LM\u2019s business interests, security, or reputation. This includes
                any content that may infringe on intellectual property rights, violate privacy laws, or harm the
                integrity of LM\u2019s platform or brand.</li>
            <li>Intellectual Property Infringement: Uploading, sharing, or otherwise distributing any content on
                eTabella that infringes on copyrights, trademarks, trade secrets, or other intellectual property rights.
                This includes unauthorized use or sharing of LM-provided materials, Annotated Transcripts, Client
                My HearingHub (Client HH) materials, software interface design and functionality, user help guides, and any
                other proprietary resources intended solely for authorized user access.</li>
            <li>Providing Access to Competitors: Sharing, granting, or facilitating access\u2014whether directly or
                indirectly\u2014to LM's eTabella software, proprietary information, or sensitive materials with any of LM\u2019s
                competitors or their representatives. This includes, but is not limited to, disclosing Client My HearingHub
                (Client HH) materials, software interface design and functionality, user help guides, and other
                proprietary resources that are strictly for authorized user access only. Competitors include any entity
                offering services similar to LM\u2019s hearing and software solutions.</li>
            <li>Misuse of Messaging Features: Using eTabella\u2019s internal messaging system for unauthorized or disruptive
                purposes, such as non-business-related solicitations, advertisements, or excessive, irrelevant messaging
                that could detract from the platform\u2019s professional use.</li>
            <li>Impersonation: Misrepresenting one\u2019s identity, role, organization, or affiliation with LM while using
                eTabella. This includes falsely claiming roles or permissions that grant access to restricted areas or
                content within the platform.</li>
            <li>Additional Restrictions: The activities listed above are not exhaustive. Any behavior that undermines
                the security, integrity, or intended use of eTabella may be deemed a violation of this Acceptable Use
                Policy, even if not explicitly prohibited.</li>
        </ul>
    </div>`
      },
      {
        id: "userResponsibilities",
        title: "User Responsibilities",
        content: `<div>
        <p>Users, including End Users, are responsible for:</p>
        <ul>
            <li>Maintaining Account Security: Safeguarding their login credentials and preventing unauthorized access by
                not sharing their passwords or user accounts with others.</li>
            <li>Respecting Access Controls: Adhering to the access levels set by LM or the designated Master
                Administrator within each Client\u2019s organization and refraining from attempting to bypass permissions to
                access restricted areas, such as the Arbiter My HearingHub (Arbiter HH) and Client My HearingHub (Client HH).
            </li>
            <li>Ensuring Professional Conduct: Using eTabella solely for legitimate business purposes related to the
                specific Matter(s) for which access has been granted, and aligning all activities with LM\u2019s standards of
                professional, secure, and responsible use.</li>
            <li>Reporting Violations: Promptly reporting any observed or suspected violations of this Acceptable Use
                Policy to LM to support a secure and compliant platform environment.</li>
        </ul>
    </div>`
      },
      {
        id: "monitoring",
        title: "Monitoring and Enforcement",
        content: `        <p>LM reserves the right to monitor user activity within eTabella to ensure compliance with this Acceptable Use Policy. This may include reviewing access logs, message content, and other relevant activity data as permitted by applicable laws. LM may investigate any suspected violations and take appropriate action, which can include warnings, suspension, or termination of access. In cases of significant breaches, LM reserves the right to pursue further legal action.</p>
`
      },
      {
        id: "amendments",
        title: "Amendments",
        content: `        <p>LM may modify this AUP at any time. Users and End Users will be notified of significant changes, such as through email or an in-platform alert, and are expected to review and comply with the updated policy.</p>
`
      },
      {
        id: "reportingViolations",
        title: "Reporting Violations",
        content: `        <p>To report a violation of this AUP, please promptly contact LM at eTabella@. All reports will be handled confidentially to the extent possible and reviewed to ensure platform integrity and compliance.</p>
`
      }
    ];
    this.activeTab = this.tabs[0].id;
    this.lastTwoSections = ["amendments", "reportingViolations", "monitoring"];
  }
  ngOnInit() {
    this.showpolicy = false;
    this.socket.disconnect();
    this.loginForm = this.formBuilder.group({
      cEmail: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required]]
      //, Validators.minLength(6), Validators.pattern('^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{6,}$')
    });
  }
  ngAfterViewInit() {
    const aupchcek = localStorage.getItem("AupAgreed");
    if (aupchcek == "Y") {
      this.agreed = true;
    }
    this.updateActiveTabOnScroll();
  }
  // @HostListener('window:scroll', [])
  onWindowScroll(scrollContainer) {
    this.updateActiveTabOnScroll();
    this.checkIfReachedEnd(scrollContainer);
  }
  scrollToSection(sectionId, tab, parent) {
    this.isScrollingFromClick = true;
    this.activeTab = sectionId;
    this.activtop = tab.getBoundingClientRect().top - parent.getBoundingClientRect().top;
    console.log(this.activtop);
    const section = this.getTabElementById(sectionId, this.sectionElements);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = setTimeout(() => {
      this.isScrollingFromClick = false;
    }, 2e3);
  }
  checkIfReachedEnd(scrollContainer) {
    const scrollPosition = scrollContainer.scrollTop + scrollContainer.clientHeight + 20;
    const scrollHeight = scrollContainer.scrollHeight;
    if (!this.reachedEnd && scrollPosition >= scrollHeight) {
      this.reachedEnd = true;
    }
  }
  getTabElementById(id, array) {
    let tabelm;
    array.forEach((element) => {
      if (element.nativeElement.id == id) {
        tabelm = element;
      }
    });
    return tabelm.nativeElement;
  }
  updateActiveTabOnScroll() {
    if (this.isScrollingFromClick)
      return;
    let closestSectionId = "";
    let closestDistance = Infinity;
    const targetOffset = 150;
    const viewportHeight = window.innerHeight;
    this.sectionElements.forEach((section) => {
      const rect = section.nativeElement.getBoundingClientRect();
      const sectionId = section.nativeElement.id;
      if (this.lastTwoSections.includes(sectionId)) {
        if (rect.bottom <= viewportHeight && rect.bottom >= 0) {
          closestSectionId = sectionId;
        }
      } else {
        const distance = Math.abs(rect.top - targetOffset);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestSectionId = sectionId;
        }
      }
    });
    if (closestSectionId) {
      this.activeTab = closestSectionId;
      const tab = this.getTabElementById(this.activeTab, this.tabelemets);
      this.activtop = tab.getBoundingClientRect().top - this.parenntEl.nativeElement.getBoundingClientRect().top;
    }
  }
  isagreed() {
    localStorage.setItem("AupAgreed", "Y");
    this.agreed = true;
    this.showpolicy = false;
    this.onSubmit();
  }
  onSubmit() {
    return __async(this, null, function* () {
      if (!this.agreed) {
        this.showpolicy = true;
      }
      if (this.loginForm.valid) {
        if (!this.agreed)
          return;
        this.isloading = true;
        let res = yield this.logS.login(this.loginForm.value, this.keepMeLogin);
        this.isloading = false;
        if (res) {
          this.userdetail = yield this.ss.getUserInfo();
          this.broadCast.portMessage({ event: "LOGIN", data: {} });
          this.loadprogress();
        }
      }
    });
  }
  forgot() {
    this.router.navigate(["/auth/forgotpassword"]);
  }
  loadprogress() {
    const intervalId = setInterval(() => __async(this, null, function* () {
      this.currentprogress++;
      if (this.currentprogress > 99) {
        clearInterval(intervalId);
        try {
          this.userdetail = yield this.ss.getUserInfo();
          let id = yield this.ss.getUserId();
          if (id) {
            this.socket.connect(id);
          }
        } catch (error) {
        }
        this.router.navigate(["/user/dashboard"]);
      }
    }), 15);
  }
  static {
    this.\u0275fac = function LoginComponent_Factory(t) {
      return new (t || _LoginComponent)(\u0275\u0275directiveInject(LoginService), \u0275\u0275directiveInject(Router), \u0275\u0275directiveInject(FormBuilder), \u0275\u0275directiveInject(SocketService), \u0275\u0275directiveInject(SecureStorageService), \u0275\u0275directiveInject(BroadcastingService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _LoginComponent, selectors: [["app-login"]], viewQuery: function LoginComponent_Query(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275viewQuery(_c0, 5);
        \u0275\u0275viewQuery(_c1, 5, ElementRef);
        \u0275\u0275viewQuery(_c2, 5, ElementRef);
      }
      if (rf & 2) {
        let _t;
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.parenntEl = _t.first);
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.sectionElements = _t);
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.tabelemets = _t);
      }
    }, standalone: true, features: [\u0275\u0275ProvidersFeature([LoginService]), \u0275\u0275StandaloneFeature], decls: 20, vars: 4, consts: [["parent", ""], ["scrollContainer", ""], ["curunttab", ""], ["section", ""], [1, "h-screen", "flex", "items-center", "justify-center", "bg-[#002A7B]", "overflow-hidden", "relative"], ["src", "assets/login/background.webp", 1, "absolute", "z-20", "mix-blend-multiply", "w-full", "h-[185vh]", "mt-40", "object-cover"], [1, "bg-gray-50", "shadow-[0px_0px_0px_11px_#ffffff38]", "absolute", "z-10", "w-[971px]", "h-[400px]", "rounded-3xl", "-translate-y-7", "mt-1"], [1, "h-fit", "w-fit", "relative", "z-30"], [1, "flex", "h-[400px]", "rounded-3xl", "overflow-hidden"], [1, "w-[400px]", "flex"], ["src", "assets/logo.svg", 1, "m-auto", "w-28"], ["class", "w-[571px] h-full bg-white p-24", 3, "formGroup", 4, "ngIf"], ["class", "w-[571px] h-full bg-white p-24", 4, "ngIf"], [1, "flex", "text-white", "text-xs", "w-[971px]", "mt-9"], [1, "flex", "text-end", "gap-4", "ms-auto"], [1, "cursor-pointer"], [1, "grid", "place-items-center", "top-0", "left-0", "fixed", "w-full", "h-full", "z-50"], [1, "w-[571px]", "h-full", "bg-white", "p-24", 3, "formGroup"], [1, "text-lg", "font-semibold", "mb-5"], ["class", "text-sred text-xs font-bold", 4, "ngIf"], ["type", "text", "placeholder", "Enter Email", 1, "block", "mb-5", 3, "valueChange", "icon", "value"], ["type", "password", "placeholder", "Enter Password", 1, "block", "mb-2.5", 3, "valueChange", "error", "icon", "isoutside", "value"], [1, "flex", "items-center", "w-full"], [1, "example-margin", 3, "ngModelChange", "ngModel", "ngModelOptions"], [1, "text-xs", "text-gray-400", "ms-auto", "cursor-pointer"], ["mode", "solid", "addcls", "w-full mt-5", 3, "click", "disabled", "isloading"], [1, "text-sred", "text-xs", "font-bold"], [1, "w-[571px]", "h-full", "bg-white", "p-24"], ["size", "xl", 3, "detail"], [1, "text-lg", "font-semibold", "mt-5", "mb-10"], [1, "w-100", "bg-faint", "rounded-full", "h-2.5"], [1, "bg-brand", "rounded-full", "h-2.5", 3, "ngStyle"], [1, "flex", "justify-between"], [1, "text-xxs", "text-gray-300", "mt-2"], [1, "text-xxs", "text-gray-600", "mt-2"], [1, "absolute", "top-0", "left-0", "bg-black/75", "z-10", "w-full", "h-full", 3, "click"], [1, "w-[874px]", "flex", "overflow-hidden", "h-5/6", "relative", "z-30", "rounded-2xl", "bg-white"], [1, "min-w-[276px]", "bg-faint", "h-full", "flex", "flex-col", "justify-between", "py-10", "relative"], [1, "px-1", "absolute", "left-0", "h-7", "transition-all", "bg-blue-on"], [1, "block", "w-full", "text-left", "relative", "font-semibold", "text-gray-400", "ps-10", "hover:text-blue-on", "transition", "duration-200", "text-lg", 3, "class", "id"], [1, "w-full", "flex", "flex-col", "h-full", "overflow-hidden"], [1, "h-[calc(100%_-_80px)]", "px-10", "pt-10"], [1, "h-full", "overflow-auto", "pe-3", "text-xs", 3, "scroll"], [1, "text-3xl", "text-black", "font-semibold", "mb-2.5"], [1, "flex", "items-center", "justify-between", "min-h-20", "px-10", "shadow-[1px_-9px_24px_-12px_#00000012]"], [1, "text-xs"], [1, "rounded-base", "bg-blue-on", "h-8", "flex", "text-white", "p-3", "items-center", "text-xs", "font-normal", "tracking-wide", "hover:text-blue-on", "border", "border-blue-on", "hover:bg-white", "disabled:bg-white", "disabled:text-gray-300", "disabled:border-gray-300", 3, "click", "disabled"], [1, "block", "w-full", "text-left", "relative", "font-semibold", "text-gray-400", "ps-10", "hover:text-blue-on", "transition", "duration-200", "text-lg", 3, "click", "id"], [1, "mb-2.5", "aupsections", 3, "id"], [1, "text-lg", "font-semibold", "mb-2.5", "text-dark-blue"], [1, "text-xs", "font-medium", 3, "innerHTML"]], template: function LoginComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 4);
        \u0275\u0275element(1, "img", 5)(2, "div", 6);
        \u0275\u0275elementStart(3, "div", 7)(4, "div", 8)(5, "div", 9);
        \u0275\u0275element(6, "img", 10);
        \u0275\u0275elementEnd();
        \u0275\u0275template(7, LoginComponent_form_7_Template, 13, 16, "form", 11)(8, LoginComponent_div_8_Template, 12, 6, "div", 12);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(9, "div", 13)(10, "span");
        \u0275\u0275text(11);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(12, "span", 14)(13, "span", 15);
        \u0275\u0275text(14, "Terms of Service");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(15, "span", 15);
        \u0275\u0275text(16, "Privacy Policy");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(17, "span", 15);
        \u0275\u0275text(18, "Security");
        \u0275\u0275elementEnd()()()()();
        \u0275\u0275template(19, LoginComponent_Conditional_19_Template, 24, 6, "div", 16);
      }
      if (rf & 2) {
        \u0275\u0275advance(7);
        \u0275\u0275property("ngIf", ctx.currentprogress <= 0);
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.currentprogress > 0);
        \u0275\u0275advance(3);
        \u0275\u0275textInterpolate1("\xA9 ", ctx.getYear, " eTabella. All rights reserved. ");
        \u0275\u0275advance(8);
        \u0275\u0275conditional(19, ctx.showpolicy ? 19 : -1);
      }
    }, dependencies: [CommonModule, NgIf, NgStyle, FormsModule, \u0275NgNoValidate, NgControlStatus, NgControlStatusGroup, NgModel, ReactiveFormsModule, FormGroupDirective, InputComponent, MatCheckboxModule, MatCheckbox, ButtonComponent, AvatarComponent] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(LoginComponent, { className: "LoginComponent", filePath: "src\\app\\core\\authantication\\login\\login.component.ts", lineNumber: 21 });
})();
export {
  LoginComponent
};
//# sourceMappingURL=chunk-U7QRKJI7.js.map
