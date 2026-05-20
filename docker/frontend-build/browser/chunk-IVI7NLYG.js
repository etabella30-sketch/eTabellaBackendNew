import {
  ColorpickerComponent
} from "./chunk-BOOJJNDB.js";
import {
  TeamsetupService
} from "./chunk-OF6H7YN5.js";
import {
  NgScrollbarModule
} from "./chunk-WZNPCXMG.js";
import {
  SkeletonComponent
} from "./chunk-KEJC4ZXM.js";
import {
  CdkDrag,
  CdkDragPlaceholder,
  CdkDragPreview,
  CdkDropList,
  CdkDropListGroup,
  DragDropModule
} from "./chunk-EZOJOG5D.js";
import {
  CasedetailService
} from "./chunk-XYPEOTVH.js";
import {
  UsercreationComponent
} from "./chunk-3A6FZELH.js";
import {
  HeaderService
} from "./chunk-PNJCYNRI.js";
import "./chunk-43QUFIPG.js";
import "./chunk-E4U5AV5T.js";
import {
  CommunicationService
} from "./chunk-KCDHWQ5X.js";
import {
  MatSelect,
  MatSelectModule,
  MatSelectTrigger
} from "./chunk-BM3TWEH3.js";
import "./chunk-Y2GGPNYR.js";
import {
  InputComponent
} from "./chunk-FEMUAMTL.js";
import {
  UserPermissionService
} from "./chunk-EU2KOPNR.js";
import "./chunk-TECZMXLZ.js";
import {
  MatTooltip,
  MatTooltipModule
} from "./chunk-2HPWN6DG.js";
import {
  AvatarComponent
} from "./chunk-H74SWAKT.js";
import {
  MatMenu,
  MatMenuModule,
  MatMenuTrigger
} from "./chunk-4QNWYMPA.js";
import {
  CommonfunctionService,
  DialogueComponent
} from "./chunk-TNIBXRF4.js";
import "./chunk-BXSF7XA6.js";
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef
} from "./chunk-UVEQGFJV.js";
import "./chunk-QZYXJIJ7.js";
import {
  SecureStorageService
} from "./chunk-42T75ZKA.js";
import {
  DefaultValueAccessor,
  FormsModule,
  NgControlStatus,
  NgModel,
  UntypedFormControl
} from "./chunk-CIO7JDBK.js";
import "./chunk-NKPXCEC5.js";
import "./chunk-W3IEBGJA.js";
import "./chunk-6RMJH3FI.js";
import "./chunk-DXEI33EW.js";
import "./chunk-UA722RUW.js";
import "./chunk-SI4QPUAD.js";
import {
  ButtonComponent
} from "./chunk-4BFWRZ22.js";
import {
  CdkFixedSizeVirtualScroll,
  CdkVirtualForOf,
  CdkVirtualScrollViewport,
  ScrollingModule
} from "./chunk-MESCMVD2.js";
import "./chunk-AIKHFB75.js";
import {
  MatOption
} from "./chunk-4SC6BA7R.js";
import {
  IconComponent
} from "./chunk-MLRGQ4I6.js";
import "./chunk-D2JKPWBT.js";
import {
  ActivatedRoute
} from "./chunk-FNSUDMGC.js";
import "./chunk-EVEACXQX.js";
import {
  CommonModule,
  NgClass,
  NgForOf,
  NgIf,
  NgStyle
} from "./chunk-YBHDQMOW.js";
import {
  BehaviorSubject,
  ChangeDetectorRef,
  EventEmitter,
  __async,
  ɵsetClassDebugInfo,
  ɵɵNgOnChangesFeature,
  ɵɵStandaloneFeature,
  ɵɵadvance,
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
  ɵɵnamespaceHTML,
  ɵɵnamespaceSVG,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵpureFunction0,
  ɵɵpureFunction1,
  ɵɵqueryRefresh,
  ɵɵreference,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIdentity,
  ɵɵrepeaterTrackByIndex,
  ɵɵresetView,
  ɵɵresolveDocument,
  ɵɵrestoreView,
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

// src/app/adminpanel/components/casebuilder/userlist/userlist.component.ts
var _c0 = (a0) => [a0];
var _c1 = () => [1, 2, 3, 4, 5, 6, 7, 8, 9];
var _c2 = (a0) => ({ "order-10": a0 });
var _c3 = (a0) => ({ "background": a0 });
var _c4 = (a0) => ({ "pointer-events-none": a0 });
function UserlistComponent_avtr_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "avtr", 36);
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275property("detail", ctx_r1.userDetail);
  }
}
function UserlistComponent_Conditional_11_div_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 40);
    \u0275\u0275element(1, "icon", 38);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext(2);
    \u0275\u0275property("ngStyle", \u0275\u0275pureFunction1(2, _c3, ctx_r1.isdrging ? "#4f4f4f" : ctx_r1.getColor(ctx_r1.userDetail.cClr)));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", ctx_r1.isdrging ? "Unassigned" : ctx_r1.userDetail.cTeamname, " ");
  }
}
function UserlistComponent_Conditional_11_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 37);
    \u0275\u0275listener("cdkDragStarted", function UserlistComponent_Conditional_11_Template_div_cdkDragStarted_0_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onDragStarted($event, ctx_r1.userDetail));
    })("cdkDragEnded", function UserlistComponent_Conditional_11_Template_div_cdkDragEnded_0_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onDragEnded($event, ctx_r1.userDetail));
    })("cdkDragMoved", function UserlistComponent_Conditional_11_Template_div_cdkDragMoved_0_listener($event) {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onDraging($event, ctx_r1.userDetail));
    });
    \u0275\u0275element(1, "icon", 38);
    \u0275\u0275text(2);
    \u0275\u0275template(3, UserlistComponent_Conditional_11_div_3_Template, 3, 4, "div", 39);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(3, _c2, ctx_r1.userDetail.nTeamid))("ngStyle", \u0275\u0275pureFunction1(5, _c3, ctx_r1.userDetail.cClr ? ctx_r1.getColor(ctx_r1.userDetail.cClr) : "#CA7AD1"));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", ctx_r1.userDetail.cTeamname, " ");
  }
}
function UserlistComponent_Conditional_12_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 41);
    \u0275\u0275text(1, " Drop a team here ");
    \u0275\u0275elementEnd();
  }
}
function UserlistComponent_mat_option_28_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 42)(1, "dl", 43)(2, "dl", 44);
    \u0275\u0275element(3, "icon", 45);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const x_r4 = ctx.$implicit;
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275property("value", x_r4.nTeamid);
    \u0275\u0275advance(2);
    \u0275\u0275property("ngStyle", \u0275\u0275pureFunction1(3, _c3, x_r4.cClr ? ctx_r1.getColor(x_r4.cClr) : "#CA7AD1"));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("", x_r4.cTeamname, " ");
  }
}
function UserlistComponent_mat_option_36_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "mat-option", 46)(1, "div", 47);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const x_r5 = ctx.$implicit;
    \u0275\u0275property("value", x_r5);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", x_r5, " ");
  }
}
function UserlistComponent_div_39_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div", 48);
  }
}
function UserlistComponent_For_42_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 32);
    \u0275\u0275element(1, "sklton", 49)(2, "sklton", 50)(3, "sklton", 51)(4, "sklton", 52);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275property("isavatar", true);
    \u0275\u0275advance(3);
    \u0275\u0275property("isavatar", true);
  }
}
function UserlistComponent_div_45__svg_svg_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275namespaceSVG();
    \u0275\u0275elementStart(0, "svg", 6);
    \u0275\u0275element(1, "path", 57);
    \u0275\u0275elementEnd();
  }
}
function UserlistComponent_div_45_Conditional_8_div_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 40);
    \u0275\u0275element(1, "icon", 38);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const y_r7 = \u0275\u0275nextContext(2).$implicit;
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275property("ngStyle", \u0275\u0275pureFunction1(2, _c3, ctx_r1.isdrging ? "#4f4f4f" : ctx_r1.getColor(y_r7.cClr)));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", ctx_r1.isdrging ? "Unassigned" : y_r7.cTeamname, " ");
  }
}
function UserlistComponent_div_45_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 58);
    \u0275\u0275listener("cdkDragStarted", function UserlistComponent_div_45_Conditional_8_Template_div_cdkDragStarted_0_listener($event) {
      \u0275\u0275restoreView(_r8);
      const y_r7 = \u0275\u0275nextContext().$implicit;
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onDragStarted($event, y_r7));
    })("cdkDragEnded", function UserlistComponent_div_45_Conditional_8_Template_div_cdkDragEnded_0_listener($event) {
      \u0275\u0275restoreView(_r8);
      const y_r7 = \u0275\u0275nextContext().$implicit;
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onDragEnded($event, y_r7));
    })("cdkDragMoved", function UserlistComponent_div_45_Conditional_8_Template_div_cdkDragMoved_0_listener($event) {
      \u0275\u0275restoreView(_r8);
      const y_r7 = \u0275\u0275nextContext().$implicit;
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.onDraging($event, y_r7));
    });
    \u0275\u0275element(1, "icon", 38);
    \u0275\u0275text(2);
    \u0275\u0275template(3, UserlistComponent_div_45_Conditional_8_div_3_Template, 3, 4, "div", 39);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const y_r7 = \u0275\u0275nextContext().$implicit;
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(4, _c2, y_r7.nTeamid))("cdkDragDisabled", ctx_r1.isdraging)("ngStyle", \u0275\u0275pureFunction1(6, _c3, y_r7.cClr ? ctx_r1.getColor(y_r7.cClr) : "#CA7AD1"));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", y_r7.cTeamname, " ");
  }
}
function UserlistComponent_div_45_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 53);
    \u0275\u0275listener("cdkDropListDropped", function UserlistComponent_div_45_Template_div_cdkDropListDropped_0_listener($event) {
      const y_r7 = \u0275\u0275restoreView(_r6).$implicit;
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.drop($event, y_r7, "U"));
    });
    \u0275\u0275elementStart(1, "div", 4);
    \u0275\u0275element(2, "avtr", 36);
    \u0275\u0275template(3, UserlistComponent_div_45__svg_svg_3_Template, 2, 0, "svg", 54);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "span", 8);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "span", 9);
    \u0275\u0275text(7);
    \u0275\u0275elementEnd();
    \u0275\u0275template(8, UserlistComponent_div_45_Conditional_8_Template, 4, 8, "div", 55);
    \u0275\u0275elementStart(9, "icon", 56);
    \u0275\u0275listener("click", function UserlistComponent_div_45_Template_icon_click_9_listener() {
      const y_r7 = \u0275\u0275restoreView(_r6).$implicit;
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.viewUser(y_r7));
    });
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const y_r7 = ctx.$implicit;
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275classMap(\u0275\u0275pureFunction1(10, _c4, ctx_r1.isdrging));
    \u0275\u0275property("cdkDropListData", \u0275\u0275pureFunction1(12, _c0, y_r7))("cdkDropListEnterPredicate", ctx_r1.dropListEnterPredicate(y_r7));
    \u0275\u0275advance(2);
    \u0275\u0275property("detail", y_r7);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", y_r7.nRoleid == 2);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate2(" ", y_r7.cFname, " ", y_r7.cLname, " ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", y_r7.cEmail, "");
    \u0275\u0275advance();
    \u0275\u0275conditional(8, y_r7.nTeamid ? 8 : -1);
  }
}
function UserlistComponent_div_46_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div", 59);
  }
}
var UserlistComponent = class _UserlistComponent {
  constructor(ss, teamS, route, dialog, cs, cdr) {
    this.ss = ss;
    this.teamS = teamS;
    this.route = route;
    this.dialog = dialog;
    this.cs = cs;
    this.cdr = cdr;
    this.userChange = new EventEmitter();
    this.isdrging = false;
    this.reached = "S";
    this.tempuserlist = [];
    this.teamsort = "All";
    this.namesort = "All";
    this.alphas = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
    this.searchText = "";
    this.offset = new BehaviorSubject(0);
    this.limit = 20;
    this.isLoading = false;
    this.isdraging = false;
    this.checkEventSub();
  }
  checkEventSub() {
    return __async(this, null, function* () {
      this.evsubscription = this.cs.functionCalled$.subscribe((data) => __async(this, null, function* () {
        if (data == "USER-RELOAD") {
          this.tempuserlist = [];
          this.getUserList(1);
        }
      }));
    });
  }
  ngOnInit() {
    return __async(this, null, function* () {
      this.userDetail = yield this.ss.getUserInfo();
      this.userDetail["nTeamid"] = null;
      this.userDetail["cTeamname"] = null;
      this.userDetail["cClr"] = null;
    });
  }
  ngAfterViewInit() {
    this.getUserList(1);
  }
  ngOnDestroy() {
    this.evsubscription.unsubscribe();
  }
  getUserList(pageNumber, nTeamid) {
    this.isdrging = false;
    if (this.isLoading) {
      return;
    }
    ;
    this.isLoading = true;
    var mdl = { nCaseid: this.nCaseid, pageNumber, nTeamid: nTeamid ? nTeamid : null, searchText: this.searchText, cLname: this.namesort };
    this.teamS.userList(mdl).then((res) => {
      this.tempuserlist = this.tempuserlist.concat(res);
      this.isLoading = false;
      console.log("getuser");
      this.setAssignes();
      this.reached = "S";
    });
  }
  setUserteam() {
    if (this.assignedusers && this.assignedusers.length && this.teamlist && this.teamlist.length) {
      var ind = this.assignedusers.findIndex((user) => user.u == this.userDetail.nUserid);
      if (ind > -1) {
        this.userDetail["nTeamid"] = this.assignedusers[ind]["t"];
        this.userDetail["nRoleid"] = this.assignedusers[ind]["r"];
        if (this.teamlist && this.teamlist.length) {
          var teamInd = this.teamlist.findIndex((team) => team.nTeamid == this.userDetail["nTeamid"]);
          if (teamInd > -1) {
            this.userDetail["cTeamname"] = this.teamlist[teamInd]["cTeamname"];
            this.userDetail["cClr"] = this.teamlist[teamInd]["cClr"];
          }
        }
      }
    }
  }
  trackByUserId(index, item) {
    return item.nUserid;
  }
  ngOnChanges(changes) {
    if (changes["nCaseid"] || changes["dragteam"]) {
      return;
    }
    this.setAssignes();
    this.setUserteam();
    return;
  }
  sortTeam() {
    const nTeamid = this.teamsort && this.teamsort != "All" ? this.teamsort : null;
    this.tempuserlist = [];
    debugger;
    this.getUserList(1, nTeamid);
  }
  setAssignes() {
    if (this.tempuserlist && this.assignedusers && this.teamlist && this.tempuserlist.length && this.assignedusers.length && this.teamlist.length) {
      this.tempuserlist.filter((user) => this.assignedusers.some((auser) => auser.u === user.nUserid)).forEach((user) => {
        var auser = this.assignedusers.find((auser2) => auser2.u === user.nUserid);
        user.nTeamid = auser.t;
        user.nRoleid = auser.r;
        if (this.teamlist && this.teamlist.length) {
          var ind = this.teamlist.findIndex((t) => t.nTeamid == user.nTeamid);
          if (ind > -1) {
            user["cTeamname"] = this.teamlist[ind].cTeamname;
            user["cClr"] = this.teamlist[ind].cClr;
          } else {
            user.nTeamid = null;
            user["cTeamname"] = "";
            user["cClr"] = "";
            user["nRoleid"] = null;
          }
        }
      });
    }
  }
  getColor(cClr) {
    return cClr ? cClr.substring(0, 7).toUpperCase() : "";
  }
  drop(event, x, flag) {
    var user = {};
    if (event.previousContainer === event.container) {
    } else {
      try {
        var team = event.previousContainer.data[event.previousIndex];
        this.tempuserlist.filter((e) => e.nUserid === x.nUserid).map((e) => {
          if (!e.nTeamid) {
            e.nTeamid = team.nTeamid;
            e.cTeamname = team.cTeamname;
            e.cClr = team.cClr;
            user = { u: e.nUserid, t: team.nTeamid };
            var res2 = { type: "drag", user };
            this.userChange.emit(res2);
          } else {
            e.nTeamid = team.nTeamid;
            e.cTeamname = team.cTeamname;
            e.cClr = team.cClr;
            user = { u: e.nUserid, t: team.nTeamid };
            var res2 = { type: "drag", user };
            this.userChange.emit(res2);
          }
        });
        if (x.nUserid == this.userDetail.nUserid && !this.userDetail.nTeamid) {
          this.userDetail.nTeamid = team.nTeamid;
          this.userDetail.cTeamname = team.cTeamname;
          this.userDetail.cClr = team.cClr;
          user = { u: this.userDetail.nUserid, t: team.nTeamid };
          var res = { type: "drag", user };
          this.userChange.emit(res);
        } else if (x.nUserid == this.userDetail.nUserid) {
          this.userDetail.nTeamid = team.nTeamid;
          this.userDetail.cTeamname = team.cTeamname;
          this.userDetail.cClr = team.cClr;
          user = { u: this.userDetail.nUserid, t: team.nTeamid };
          var res = { type: "drag", user };
          this.userChange.emit(res);
        }
      } catch (error) {
      }
    }
    this.isdrging = false;
  }
  onDragEnded(event, user) {
    const distanceX = Math.abs(event.distance.x - 0);
    const distanceY = Math.abs(event.distance.y - 0);
    if (distanceX > 150 || distanceY > 50) {
      const index = this.tempuserlist.findIndex((u) => u.nUserid === user.nUserid);
      if (index !== -1) {
        var rmuser = { u: user.nUserid, t: user.nTeamid };
        this.tempuserlist[index].nTeamid = null;
        this.tempuserlist[index].cTeamname = null;
        var res = { type: "dragrm", user: rmuser };
        this.userChange.emit(res);
      } else {
        if (user.nUserid == this.userDetail.nUserid) {
          var rmuser = { u: user.nUserid, t: user.nTeamid };
          this.userDetail["nTeamid"] = null;
          this.userDetail["cTeamname"] = null;
          var res = { type: "dragrm", user: rmuser };
          this.userChange.emit(res);
        }
      }
      this.draggedUser = null;
    }
    this.isdraging = false;
  }
  dropListEnterPredicate(list) {
    if (this.isdrging)
      return function() {
        return false;
      };
    return function() {
      return true;
    };
  }
  onDraging(event, user) {
    const distanceX = Math.abs(event.distance.x);
    const distanceY = Math.abs(event.distance.y);
    if (distanceX > 150 || distanceY > 10) {
      this.isdrging = true;
    } else {
      this.isdrging = false;
    }
  }
  onDragStarted(event, user) {
    this.isdrging = false;
    this.draggedUser = user;
  }
  updateUserteam() {
    if (this.userDetail.nTeamid) {
      var ind = this.teamlist.findIndex((t) => t.nTeamid == this.userDetail.nTeamid);
      if (ind > -1) {
        this.userDetail["cTeamname"] = this.teamlist[ind].cTeamname;
        this.userDetail["cClr"] = this.teamlist[ind].cClr;
      } else {
        this.userDetail.nTeamid = null;
        this.userDetail["cTeamname"] = "";
        this.userDetail["cClr"] = "";
        this.userDetail["nRoleid"] = null;
      }
    }
  }
  getTeamName(nTeamid) {
    return this.teamlist && this.teamlist.length && this.teamlist.find((e) => e.nTeamid == nTeamid) ? this.teamlist.find((e) => e.nTeamid == nTeamid).cTeamname : "All";
  }
  viewUser(x) {
    let nUTeamid = this.userDetail.nTeamid;
    const dialogRef = this.dialog.open(UsercreationComponent, {
      width: "fit-content",
      height: "fit-content",
      panelClass: ["addusermodal", "rounded-10", "overflow-hidden"],
      data: {
        nCaseid: this.nCaseid,
        nUserid: x && x.nUserid ? x.nUserid : null,
        nTeamid: x && x.nTeamid ? x.nTeamid : null,
        nUTeamid
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result && result["isSave"]) {
        if (result["delete"]) {
          var ind = this.tempuserlist.findIndex((user2) => user2.nUserid == x.nUserid);
          this.tempuserlist.splice(ind, 1);
          this.tempuserlist = [];
          const nTeamid = this.teamsort;
          this.getUserList(1, nTeamid);
          return;
        } else {
          var values = dialogRef.componentInstance.userForm.value;
          x.cFname = values.cFname;
          x.cLname = values.cLname;
          x.cEmail = values.cEmail;
          x.cProfile = values.cProfile;
          this.cdr.detectChanges();
          if (this.userDetail.nUserid == values.nUserid) {
            this.userDetail.cFname = values.cFname;
            this.userDetail.cLname = values.cLname;
            this.userDetail.cEmail = values.cEmail;
            this.userDetail.cProfile = values.cProfile;
          }
          if (x.nTeamid != values.nTeamid) {
            var rmuser = { u: x.nUserid, t: x.nTeamid };
            var res = { type: "dragrm", user: rmuser };
            this.userChange.emit(res);
            x.nTeamid = values.nTeamid;
            x.nRoleid = values.nRoleid;
            var team = this.teamlist.find((team2) => team2.nTeamid == values.nTeamid);
            x.cTeamname = team.cTeamname;
            x.cClr = team.cClr;
            var user = { u: x.nUserid, t: values.nTeamid };
            var res = { type: "drag", user };
            this.userChange.emit(res);
          }
        }
      }
    });
  }
  scrolled(ev) {
    const threshold = 0;
    const element = ev.target;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;
    if (scrollHeight - scrollTop <= clientHeight + threshold) {
      this.reached = "E";
    } else if (scrollTop === 0) {
      this.reached = "S";
    } else {
      this.reached = "M";
    }
    const end = this.viewport.getRenderedRange().end;
    const total = this.viewport.getDataLength();
    if (end === total) {
      var pageno = total / this.limit + 1;
      if (pageno % 1 || pageno < this.tempuserlist.length / this.limit) {
        return;
      }
      const nTeamid = this.teamsort;
      this.getUserList(pageno, nTeamid);
    }
  }
  static {
    this.\u0275fac = function UserlistComponent_Factory(t) {
      return new (t || _UserlistComponent)(\u0275\u0275directiveInject(SecureStorageService), \u0275\u0275directiveInject(TeamsetupService), \u0275\u0275directiveInject(ActivatedRoute), \u0275\u0275directiveInject(MatDialog), \u0275\u0275directiveInject(CommunicationService), \u0275\u0275directiveInject(ChangeDetectorRef));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _UserlistComponent, selectors: [["userlist"]], viewQuery: function UserlistComponent_Query(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275viewQuery(CdkVirtualScrollViewport, 5);
        \u0275\u0275viewQuery(CdkVirtualScrollViewport, 5);
      }
      if (rf & 2) {
        let _t;
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.scrollViewport = _t.first);
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.viewport = _t.first);
      }
    }, inputs: { nCaseid: "nCaseid", teamlist: "teamlist", dragteam: "dragteam", refresh: "refresh", assignedusers: "assignedusers" }, outputs: { userChange: "userChange" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 47, vars: 25, consts: [["list2", "cdkDropList"], ["scrollViewport", ""], [1, "flex", "flex-col", "h-full"], ["cdkDropList", "", 1, "user", "group", "hover:bg-white", "flex", "items-center", "w-full", "px-2.5", "py-1.5", "gap-3", "bg-white/25", "rounded-lg", 3, "cdkDropListDropped", "id", "cdkDropListData", "cdkDropListEnterPredicate"], [1, "relative"], [3, "detail", 4, "ngIf"], ["width", "12", "height", "11", "viewBox", "0 0 12 11", "fill", "none", "xmlns", "http://www.w3.org/2000/svg", 1, "absolute", "bottom-0", "right-0"], ["d", "M5.91033 1.18166C5.94701 1.10735 6.05299 1.10735 6.08967 1.18166L7.52176 4.08291C7.53631 4.11239 7.56443 4.13284 7.59696 4.1376L10.7996 4.60571C10.8816 4.6177 10.9143 4.71848 10.8549 4.7763L8.53768 7.0333C8.51409 7.05628 8.50333 7.08939 8.50889 7.12184L9.05574 10.3103C9.06975 10.392 8.984 10.4543 8.91064 10.4157L6.04655 8.90948C6.01741 8.89415 5.98259 8.89415 5.95345 8.90948L3.08936 10.4157C3.016 10.4543 2.93025 10.392 2.94426 10.3103L3.49111 7.12184C3.49667 7.08939 3.48591 7.05628 3.46232 7.0333L1.14507 4.7763C1.08571 4.71848 1.11839 4.6177 1.20038 4.60571L4.40304 4.1376C4.43557 4.13284 4.46369 4.11239 4.47824 4.08291L5.91033 1.18166Z", "stroke", "white", "fill", "#FEDF32", "stroke-width", "0.775", "stroke-linecap", "round", "stroke-linejoin", "round"], [1, "text-xs", "text-white", "group-hover:!text-grey", "font-medium"], [1, "ms-auto", "text-xs", "text-white", "group-hover:!text-grey"], ["cdkDrag", "", 1, "relative", "team", "group", "c-pointer", "h-8", "p-2.5", "flex", "items-center", "gap-2.5", "text-white", "text-xs", "rounded-lg", "w-fit", 3, "ngClass", "ngStyle"], ["name", "info", 1, "text-dark-blue", "text-sm", "order-10", "cursor-pointer", 3, "click"], [1, "mt-2.5", "flex", "items-center"], [1, "relative", "w-64"], [1, "absolute", "inset-y-0", "start-0", "flex", "items-center", "ps-3", "pointer-events-none", "text-tab"], ["name", "search"], ["type", "text", "id", "default-search", "placeholder", "Search users by name/email /role", 1, "block", "w-full", "py-2", "rounded-full", "ps-9", "pe-1.5", "text-xs", "text-gray-100", "placeholder:text-gray-100/50", "border", "border-white/40", "bg-transparent", "focus:border-blue-hover", "focus:outline-none", "focus:shadow-[0px_0px_6px_#0066FF]", 3, "ngModelChange", "keyup.enter", "ngModel"], [1, "flex", "gap-2", "text-white", "text-xs", "ms-auto", "text-nowrap", "items-center"], ["disableOptionCentering", "", "panelClass", "", "panelClass", "min-w-fit", 1, "text-white", "border-solid", "border", "border-white/40", "mx-auto", "bg-transparent", "min-w-40", "rounded-base", 2, "--caretclr", "white", 3, "valueChange", "selectionChange", "value"], [1, "flex", "items-center", "gap-2", "text-white", "text-xs"], [3, "value"], [1, "flex", "items-center", "h-full", "text-xs", "w-full", "p-1", "gap-2", "flex-row", "group-hover:!bg-gray-200", "!text-mgray-700", "option"], ["class", " group !mb-0 !h-fit min-w-fit", 3, "value", 4, "ngFor", "ngForOf"], ["disableOptionCentering", "", "panelClass", "", 1, "text-white", "border-solid", "border", "border-white/40", "mx-auto", "bg-transparent", "min-w-40", "rounded-base", 2, "--caretclr", "white", 3, "valueChange", "selectionChange", "value"], [1, "d-flex", "align-items-center", "gap-2", "text-white", "text-xs"], [1, "p-2", 3, "value"], [1, "d-flex", "align-items-cente", "text-xs", "h-full", "w-full", "p-1", "gap-2", "flex-row", "!text-mgray-700", "option"], ["class", " group !p-1", 3, "value", 4, "ngFor", "ngForOf"], [1, "h-full", "overflow-hidden", "mt-2.5"], [1, "h-full", "overflow-auto"], ["class", "w-full relative translate-y-14 -mt-14 z-20 h-14 bg-gradient-to-b from-dark-blue to-transparent", 4, "ngIf"], [1, "h-full", "overflow-hidden", 3, "hidden"], [1, "bg-white/10", "rounded-base", "p-3", "py-1.5", "flex", "items-center", "gap-3", "mb-3", "last:mb-0"], ["itemSize", "57", 1, "h-full", "overflow-auto", 3, "scroll"], ["class", "user group hover:bg-white flex items-center w-full px-2.5 py-1.5  gap-3 mb-2.5  bg-white/25 rounded-lg", "cdkDropList", "", 3, "class", "cdkDropListData", "cdkDropListEnterPredicate", "cdkDropListDropped", 4, "cdkVirtualFor", "cdkVirtualForOf", "cdkVirtualForTrackBy"], ["class", "w-full relative   -translate-y-14 -mb-14 z-20 h-14 bg-gradient-to-t from-dark-blue to-transparent", 4, "ngIf"], [3, "detail"], ["cdkDrag", "", 1, "relative", "team", "group", "c-pointer", "h-8", "p-2.5", "flex", "items-center", "gap-2.5", "text-white", "text-xs", "rounded-lg", "w-fit", 3, "cdkDragStarted", "cdkDragEnded", "cdkDragMoved", "ngClass", "ngStyle"], ["name", "user", 1, "text-xs"], ["class", "relative team group c-pointer bg-gray-600 h-8  p-2.5 flex items-center gap-2.5 text-white text-xs  rounded-lg w-fit", 3, "ngStyle", 4, "cdkDragPreview"], [1, "relative", "team", "group", "c-pointer", "bg-gray-600", "h-8", "p-2.5", "flex", "items-center", "gap-2.5", "text-white", "text-xs", "rounded-lg", "w-fit", 3, "ngStyle"], ["cdkDrag", "", 1, "p-2", "!border", "!border-dashed", "rounded-lg", "border-white", "text-xs", "text-white", "group-hover:!text-gray-700", "group-hover:!border-gray-700", "px-2", "relative", "ms-1", "order-10"], [1, "group", "!mb-0", "!h-fit", "min-w-fit", 3, "value"], [1, "flex", "text-xs", "m-0", "align-items-center", "me-1", "h-full", "w-full", "gap-2", "flex-row", "group-hover:!bg-gray-200", "!text-mgray-700"], [1, "team", "m-0", "group", "c-pointer", "h-8", "p-2.5", "flex", "items-center", "gap-2.5", "text-white", "text-xs", "rounded-lg", "w-fit", "whitespace-nowrap", 3, "ngStyle"], ["name", "user", 1, "text-sm"], [1, "group", "!p-1", 3, "value"], [1, "flex", "items-center", "text-xs", "h-full", "w-full", "p-1", "gap-2", "flex-row", "!text-mgray-700", "option"], [1, "w-full", "relative", "translate-y-14", "-mt-14", "z-20", "h-14", "bg-gradient-to-b", "from-dark-blue", "to-transparent"], ["height", "35px", "width", "35px", 3, "isavatar"], ["height", "10px", "width", "125px"], ["height", "10px", "width", "125px", 1, "ms-auto"], ["height", "12px", "width", "12px", 3, "isavatar"], ["cdkDropList", "", 1, "user", "group", "hover:bg-white", "flex", "items-center", "w-full", "px-2.5", "py-1.5", "gap-3", "mb-2.5", "bg-white/25", "rounded-lg", 3, "cdkDropListDropped", "cdkDropListData", "cdkDropListEnterPredicate"], ["class", "absolute bottom-0 right-0", "width", "12", "height", "11", "viewBox", "0 0 12 11", "fill", "none", "xmlns", "http://www.w3.org/2000/svg", 4, "ngIf"], ["cdkDrag", "", 1, "relative", "team", "group", "cursor-grab", "active:cursor-grabbing", "h-8", "p-2.5", "flex", "items-center", "gap-2.5", "text-white", "text-xs", "rounded-lg", "w-fit", 3, "ngClass", "cdkDragDisabled", "ngStyle"], ["name", "info", "matTooltip", "User Detail", 1, "text-dark-blue", "text-sm", "order-10", "cursor-pointer", 3, "click"], ["d", "M5.91033 1.18166C5.94701 1.10735 6.05299 1.10735 6.08967 1.18166L7.52176 4.08291C7.53631 4.11239 7.56443 4.13284 7.59696 4.1376L10.7996 4.60571C10.8816 4.6177 10.9143 4.71848 10.8549 4.7763L8.53768 7.0333C8.51409 7.05628 8.50333 7.08939 8.50889 7.12184L9.05574 10.3103C9.06975 10.392 8.984 10.4543 8.91064 10.4157L6.04655 8.90948C6.01741 8.89415 5.98259 8.89415 5.95345 8.90948L3.08936 10.4157C3.016 10.4543 2.93025 10.392 2.94426 10.3103L3.49111 7.12184C3.49667 7.08939 3.48591 7.05628 3.46232 7.0333L1.14507 4.7763C1.08571 4.71848 1.11839 4.6177 1.20038 4.60571L4.40304 4.1376C4.43557 4.13284 4.46369 4.11239 4.47824 4.08291L5.91033 1.18166Z", "stroke", "white", "fill", "#0066ff", "stroke-width", "0.775", "stroke-linecap", "round", "stroke-linejoin", "round"], ["cdkDrag", "", 1, "relative", "team", "group", "cursor-grab", "active:cursor-grabbing", "h-8", "p-2.5", "flex", "items-center", "gap-2.5", "text-white", "text-xs", "rounded-lg", "w-fit", 3, "cdkDragStarted", "cdkDragEnded", "cdkDragMoved", "ngClass", "cdkDragDisabled", "ngStyle"], [1, "w-full", "relative", "-translate-y-14", "-mb-14", "z-20", "h-14", "bg-gradient-to-t", "from-dark-blue", "to-transparent"]], template: function UserlistComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275elementStart(0, "div", 2)(1, "div", 3, 0);
        \u0275\u0275listener("cdkDropListDropped", function UserlistComponent_Template_div_cdkDropListDropped_1_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.drop($event, ctx.userDetail));
        });
        \u0275\u0275elementStart(3, "div", 4);
        \u0275\u0275template(4, UserlistComponent_avtr_4_Template, 1, 1, "avtr", 5);
        \u0275\u0275namespaceSVG();
        \u0275\u0275elementStart(5, "svg", 6);
        \u0275\u0275element(6, "path", 7);
        \u0275\u0275elementEnd()();
        \u0275\u0275namespaceHTML();
        \u0275\u0275elementStart(7, "span", 8);
        \u0275\u0275text(8);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(9, "span", 9);
        \u0275\u0275text(10);
        \u0275\u0275elementEnd();
        \u0275\u0275template(11, UserlistComponent_Conditional_11_Template, 4, 7, "div", 10)(12, UserlistComponent_Conditional_12_Template, 2, 0);
        \u0275\u0275elementStart(13, "icon", 11);
        \u0275\u0275listener("click", function UserlistComponent_Template_icon_click_13_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.viewUser(ctx.userDetail));
        });
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(14, "div", 12)(15, "div", 13)(16, "div", 14);
        \u0275\u0275element(17, "icon", 15);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(18, "input", 16);
        \u0275\u0275twoWayListener("ngModelChange", function UserlistComponent_Template_input_ngModelChange_18_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.searchText, $event) || (ctx.searchText = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275listener("keyup.enter", function UserlistComponent_Template_input_keyup_enter_18_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.sortTeam());
        });
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(19, "div", 17);
        \u0275\u0275text(20, " Sort by : ");
        \u0275\u0275elementStart(21, "mat-select", 18);
        \u0275\u0275twoWayListener("valueChange", function UserlistComponent_Template_mat_select_valueChange_21_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.teamsort, $event) || (ctx.teamsort = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275listener("selectionChange", function UserlistComponent_Template_mat_select_selectionChange_21_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.sortTeam());
        });
        \u0275\u0275elementStart(22, "mat-select-trigger")(23, "div", 19);
        \u0275\u0275text(24);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(25, "mat-option", 20)(26, "div", 21);
        \u0275\u0275text(27, " Team - All ");
        \u0275\u0275elementEnd()();
        \u0275\u0275template(28, UserlistComponent_mat_option_28_Template, 5, 5, "mat-option", 22);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(29, "mat-select", 23);
        \u0275\u0275twoWayListener("valueChange", function UserlistComponent_Template_mat_select_valueChange_29_listener($event) {
          \u0275\u0275restoreView(_r1);
          \u0275\u0275twoWayBindingSet(ctx.namesort, $event) || (ctx.namesort = $event);
          return \u0275\u0275resetView($event);
        });
        \u0275\u0275listener("selectionChange", function UserlistComponent_Template_mat_select_selectionChange_29_listener() {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.sortTeam());
        });
        \u0275\u0275elementStart(30, "mat-select-trigger")(31, "div", 24);
        \u0275\u0275text(32);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(33, "mat-option", 25)(34, "div", 26);
        \u0275\u0275text(35, " Surname - All ");
        \u0275\u0275elementEnd()();
        \u0275\u0275template(36, UserlistComponent_mat_option_36_Template, 3, 2, "mat-option", 27);
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(37, "div", 28)(38, "div", 29);
        \u0275\u0275template(39, UserlistComponent_div_39_Template, 1, 0, "div", 30);
        \u0275\u0275elementStart(40, "div", 31);
        \u0275\u0275repeaterCreate(41, UserlistComponent_For_42_Template, 5, 2, "div", 32, \u0275\u0275repeaterTrackByIndex);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(43, "cdk-virtual-scroll-viewport", 33, 1);
        \u0275\u0275listener("scroll", function UserlistComponent_Template_cdk_virtual_scroll_viewport_scroll_43_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.scrolled($event));
        });
        \u0275\u0275template(45, UserlistComponent_div_45_Template, 10, 14, "div", 34);
        \u0275\u0275elementEnd();
        \u0275\u0275template(46, UserlistComponent_div_46_Template, 1, 0, "div", 35);
        \u0275\u0275elementEnd()()();
      }
      if (rf & 2) {
        \u0275\u0275advance();
        \u0275\u0275property("id", "id_" + (ctx.userDetail == null ? null : ctx.userDetail.nUserid))("cdkDropListData", \u0275\u0275pureFunction1(22, _c0, ctx.userDetail))("cdkDropListEnterPredicate", ctx.dropListEnterPredicate(ctx.userDetail));
        \u0275\u0275advance(3);
        \u0275\u0275property("ngIf", ctx.userDetail);
        \u0275\u0275advance(4);
        \u0275\u0275textInterpolate2(" ", ctx.userDetail == null ? null : ctx.userDetail.cFname, " ", ctx.userDetail == null ? null : ctx.userDetail.cLname, " ");
        \u0275\u0275advance(2);
        \u0275\u0275textInterpolate1(" ", ctx.userDetail == null ? null : ctx.userDetail.cEmail, "");
        \u0275\u0275advance();
        \u0275\u0275conditional(11, (ctx.userDetail == null ? null : ctx.userDetail.nTeamid) ? 11 : 12);
        \u0275\u0275advance(7);
        \u0275\u0275twoWayProperty("ngModel", ctx.searchText);
        \u0275\u0275advance(3);
        \u0275\u0275twoWayProperty("value", ctx.teamsort);
        \u0275\u0275advance(3);
        \u0275\u0275textInterpolate1(" Team - ", ctx.getTeamName(ctx.teamsort), " ");
        \u0275\u0275advance();
        \u0275\u0275property("value", "All");
        \u0275\u0275advance(3);
        \u0275\u0275property("ngForOf", ctx.teamlist);
        \u0275\u0275advance();
        \u0275\u0275twoWayProperty("value", ctx.namesort);
        \u0275\u0275advance(3);
        \u0275\u0275textInterpolate1(" Surname - ", ctx.namesort, " ");
        \u0275\u0275advance();
        \u0275\u0275property("value", "All");
        \u0275\u0275advance(3);
        \u0275\u0275property("ngForOf", ctx.alphas);
        \u0275\u0275advance(3);
        \u0275\u0275property("ngIf", ctx.reached != "S");
        \u0275\u0275advance();
        \u0275\u0275property("hidden", ctx.tempuserlist.length || !ctx.isLoading);
        \u0275\u0275advance();
        \u0275\u0275repeater(\u0275\u0275pureFunction0(24, _c1));
        \u0275\u0275advance(4);
        \u0275\u0275property("cdkVirtualForOf", ctx.tempuserlist)("cdkVirtualForTrackBy", ctx.trackByUserId);
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.reached != "E");
      }
    }, dependencies: [
      CommonModule,
      NgClass,
      NgForOf,
      NgIf,
      NgStyle,
      FormsModule,
      DefaultValueAccessor,
      NgControlStatus,
      NgModel,
      AvatarComponent,
      IconComponent,
      ScrollingModule,
      CdkFixedSizeVirtualScroll,
      CdkVirtualForOf,
      CdkVirtualScrollViewport,
      NgScrollbarModule,
      DragDropModule,
      CdkDropList,
      CdkDrag,
      CdkDragPreview,
      SkeletonComponent,
      MatSelectModule,
      MatSelect,
      MatSelectTrigger,
      MatOption,
      MatTooltipModule,
      MatTooltip
    ], styles: ["\n\n.placeholder-style[_ngcontent-%COMP%] {\n  border: 2px dashed #999;\n  padding: 10px;\n  margin: 5px;\n  background-color: #eee;\n  color: #666;\n  text-align: center;\n}\n/*# sourceMappingURL=userlist.component.css.map */"] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(UserlistComponent, { className: "UserlistComponent", filePath: "src\\app\\adminpanel\\components\\casebuilder\\userlist\\userlist.component.ts", lineNumber: 32 });
})();

// src/app/adminpanel/components/casebuilder/teamcreation/teamcreation.component.ts
function TeamcreationComponent_div_8_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 8)(1, "div", 9)(2, "div", 10)(3, "app-colorpicker", 11);
    \u0275\u0275twoWayListener("myColorChange", function TeamcreationComponent_div_8_Template_app_colorpicker_myColorChange_3_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r1.cClr, $event) || (ctx_r1.cClr = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(3);
    \u0275\u0275twoWayProperty("myColor", ctx_r1.cClr);
    \u0275\u0275property("colorslist", ctx_r1.colorslist);
  }
}
var TeamcreationComponent = class _TeamcreationComponent {
  onMouseMove(e) {
    try {
      var qsa = document.querySelectorAll(".color-picker .cursor")[1];
      qsa.style.background = this.arrayColors_tag.color1;
    } catch (error) {
    }
  }
  constructor(dialogRef, data, teamS) {
    this.dialogRef = dialogRef;
    this.data = data;
    this.teamS = teamS;
    this.disabled = false;
    this.color = "primary";
    this.touchUi = false;
    this.cTeamname = "";
    this.colorCtr = new UntypedFormControl(null);
    this.options = [
      { value: true, label: "True" },
      { value: false, label: "False" }
    ];
    this.listColors = ["primary", "accent", "warn"];
    this.showsubtag = false;
    this.arrayColors_tag = {
      color1: "#2883e9",
      color2: "#e920e9",
      color3: "rgb(255,245,0)",
      color4: "rgb(236,64,64)",
      color5: "rgba(45,208,45,1)"
    };
    this.selectedColor_tag = "color1";
    this.fromassignee = new EventEmitter();
    this.formsubmit = false;
    this.showconfpop = false;
    this.issuecategory = [];
    this.cClr = "#ff9163ff";
    this.pickcolor = false;
    this.isCreating = false;
    this.permission = "N";
    this.nCaseid = data["nCaseid"];
    this.nTeamid = data["nTeamid"];
    if (this.nTeamid) {
      this.permission = "E";
      this.cTeamname = data["cTeamname"];
      this.cClr = data["cClr"];
    }
  }
  ngOnInit() {
    this.teamS.teamColor(this.nCaseid).then((res) => {
      this.colorslist = res;
    });
  }
  onSubmit() {
    return __async(this, null, function* () {
      if (this.cTeamname.trim() != "") {
        var mdl = { nCaseid: this.nCaseid, nTeamid: this.nTeamid ? this.nTeamid : 0, cTeamname: this.cTeamname, cClr: this.cClr, permission: this.permission };
        let res = yield this.teamS.teamBuilder(mdl);
        if (res) {
          this.dialogRef.close({ isSave: true });
        }
      }
    });
  }
  close() {
    this.dialogRef.close();
  }
  static {
    this.\u0275fac = function TeamcreationComponent_Factory(t) {
      return new (t || _TeamcreationComponent)(\u0275\u0275directiveInject(MatDialogRef), \u0275\u0275directiveInject(MAT_DIALOG_DATA), \u0275\u0275directiveInject(TeamsetupService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _TeamcreationComponent, selectors: [["app-teamcreation"]], hostBindings: function TeamcreationComponent_HostBindings(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275listener("mousemove", function TeamcreationComponent_mousemove_HostBindingHandler($event) {
          return ctx.onMouseMove($event);
        }, false, \u0275\u0275resolveDocument);
      }
    }, outputs: { fromassignee: "fromassignee" }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 11, vars: 8, consts: [[1, "p-5"], [1, "text-base", "flex", "justify-between", "font-semibold", "mb-7"], ["name", "close", 1, "text-xs", "ms-auto", "cursor-pointer", "hover:text-blue-500", 3, "click"], [1, "flex", "items-end", "gap-2", "mb-6"], ["placeholder", "Enter Team Name", 1, "block", "w-full", 3, "valueChange", "isrequired", "showlabel", "value"], [1, "size-8", "rounded-base", "bg-gray-400", "cursor-pointer", 3, "click"], ["class", "profileslider w-100 bg-transaparent overflow-hidden rounded-3 ", 4, "ngIf"], [3, "click", "disabled"], [1, "profileslider", "w-100", "bg-transaparent", "overflow-hidden", "rounded-3"], [1, "color-pickercss", "w-100", "bg-transaparent"], [1, "rounded-3"], [1, "mx-auto", 3, "myColorChange", "myColor", "colorslist"]], template: function TeamcreationComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "h6", 1);
        \u0275\u0275text(2, "Create New Team ");
        \u0275\u0275elementStart(3, "icon", 2);
        \u0275\u0275listener("click", function TeamcreationComponent_Template_icon_click_3_listener() {
          return ctx.close();
        });
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(4, "div", 3)(5, "inpt", 4);
        \u0275\u0275listener("valueChange", function TeamcreationComponent_Template_inpt_valueChange_5_listener($event) {
          return ctx.cTeamname = $event;
        });
        \u0275\u0275text(6, " Team Name ");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(7, "div", 5);
        \u0275\u0275listener("click", function TeamcreationComponent_Template_div_click_7_listener() {
          return ctx.pickcolor = !ctx.pickcolor;
        });
        \u0275\u0275elementEnd()();
        \u0275\u0275template(8, TeamcreationComponent_div_8_Template, 4, 2, "div", 6);
        \u0275\u0275elementStart(9, "btn", 7);
        \u0275\u0275listener("click", function TeamcreationComponent_Template_btn_click_9_listener() {
          return ctx.onSubmit();
        });
        \u0275\u0275text(10);
        \u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        \u0275\u0275advance(5);
        \u0275\u0275property("isrequired", true)("showlabel", true)("value", ctx.cTeamname);
        \u0275\u0275advance(2);
        \u0275\u0275styleMap("background:" + ctx.cClr);
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", ctx.pickcolor);
        \u0275\u0275advance();
        \u0275\u0275property("disabled", ctx.cTeamname.trim() == "");
        \u0275\u0275advance();
        \u0275\u0275textInterpolate1(" ", ctx.permission == "N" ? "Create" : "Update", "");
      }
    }, dependencies: [CommonModule, NgIf, IconComponent, InputComponent, ButtonComponent, ColorpickerComponent] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(TeamcreationComponent, { className: "TeamcreationComponent", filePath: "src\\app\\adminpanel\\components\\casebuilder\\teamcreation\\teamcreation.component.ts", lineNumber: 22 });
})();

// src/app/adminpanel/components/casebuilder/teamlist/teamlist.component.ts
var _c02 = () => [12, 3, 4, 5];
var _c12 = (a0) => ({ "background": a0 });
function TeamlistComponent_Conditional_3_For_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "sklton", 10);
  }
}
function TeamlistComponent_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 3);
    \u0275\u0275repeaterCreate(1, TeamlistComponent_Conditional_3_For_2_Template, 1, 0, "sklton", 10, \u0275\u0275repeaterTrackByIndex);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275repeater(\u0275\u0275pureFunction0(0, _c02));
  }
}
function TeamlistComponent_For_6_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "span", 15)(1, "icon", 16);
    \u0275\u0275listener("click", function TeamlistComponent_For_6_Conditional_3_Template_icon_click_1_listener() {
      \u0275\u0275restoreView(_r4);
      const x_r2 = \u0275\u0275nextContext().$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.createTeam(x_r2));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275element(2, "span", 17)(3, "icon", 18, 0);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "mat-menu", 19, 1)(7, "div")(8, "h6", 20);
    \u0275\u0275text(9, "Confirm Delete ?");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "div", 3)(11, "btn", 21);
    \u0275\u0275listener("click", function TeamlistComponent_For_6_Conditional_3_Template_btn_click_11_listener() {
      \u0275\u0275restoreView(_r4);
      const x_r2 = \u0275\u0275nextContext().$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.deleteTeam(x_r2));
    });
    \u0275\u0275text(12, "Delete");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(13, "btn", 22);
    \u0275\u0275text(14, "cancel");
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const t_r5 = \u0275\u0275reference(4);
    const delete_r6 = \u0275\u0275reference(6);
    \u0275\u0275property("ngClass", !t_r5.menuOpen ? "hidden" : "flex");
    \u0275\u0275advance(3);
    \u0275\u0275property("matMenuTriggerFor", delete_r6);
  }
}
function TeamlistComponent_For_6_div_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 23);
    \u0275\u0275element(1, "icon", 24);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r2 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275property("ngStyle", \u0275\u0275pureFunction1(2, _c12, x_r2.cClr));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", x_r2.cTeamname, " ");
  }
}
function TeamlistComponent_For_6_div_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 25);
    \u0275\u0275element(1, "icon", 24);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r2 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275property("ngStyle", \u0275\u0275pureFunction1(2, _c12, x_r2.cClr));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", x_r2.cTeamname, " ");
  }
}
function TeamlistComponent_For_6_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 11);
    \u0275\u0275listener("cdkDragStarted", function TeamlistComponent_For_6_Template_div_cdkDragStarted_0_listener($event) {
      const x_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.dragStarted($event, x_r2));
    })("cdkDragMoved", function TeamlistComponent_For_6_Template_div_cdkDragMoved_0_listener($event) {
      \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onDraging($event));
    });
    \u0275\u0275element(1, "icon", 12);
    \u0275\u0275text(2);
    \u0275\u0275template(3, TeamlistComponent_For_6_Conditional_3_Template, 15, 2)(4, TeamlistComponent_For_6_div_4_Template, 3, 4, "div", 13)(5, TeamlistComponent_For_6_div_5_Template, 3, 4, "div", 14);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r2 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275property("ngStyle", \u0275\u0275pureFunction1(3, _c12, x_r2.cClr ? ctx_r2.getColor(x_r2.cClr) : "#CA7AD1"));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1(" ", x_r2.cTeamname, " ");
    \u0275\u0275advance();
    \u0275\u0275conditional(3, !x_r2.cFlag || x_r2.cFlag == "" ? 3 : -1);
  }
}
var TeamlistComponent = class _TeamlistComponent {
  constructor(teamS, dialog, ss, cdr, cs) {
    this.teamS = teamS;
    this.dialog = dialog;
    this.ss = ss;
    this.cdr = cdr;
    this.cs = cs;
    this.isdraging = false;
    this.teamChange = new EventEmitter();
    this.getUserInfo();
  }
  getUserInfo() {
    return __async(this, null, function* () {
      this.userInfo = yield this.ss.getUserInfo();
    });
  }
  dragStarted(event, x) {
    this.dragteam = x;
    var res = { type: "dragteam", dragteam: this.dragteam };
    this.teamChange.emit(res);
  }
  onDraging(ev) {
    var dragval = Math.abs(ev.distance.y);
    if (dragval > 0) {
      this.isdraging = true;
    } else {
      this.isdraging = false;
    }
  }
  dropListPredicate() {
    return function() {
      return false;
    };
  }
  ngOnChanges(changes) {
    this.cdr.detectChanges();
  }
  getColor(cClr) {
    return cClr ? cClr.substring(0, 7).toUpperCase() : "";
  }
  createTeam(x) {
    var data = {
      nCaseid: this.nCaseid,
      nTeamid: x && x.nTeamid ? x.nTeamid : null,
      cTeamname: x && x.cTeamname ? x.cTeamname : null,
      cClr: x && x.cClr ? x.cClr : null
    };
    this.openModle(TeamcreationComponent, data, "485px");
  }
  createUser(x) {
    var data = {
      nCaseid: this.nCaseid,
      nUserid: x && x.nUserid ? x.nUserid : null,
      nUTeamid: this.nUTeamid
    };
    this.openModle(UsercreationComponent, data);
  }
  openModle(component, data, width, height, x) {
    const dialogRef = this.dialog.open(component, {
      width: width ? width : "fit-content",
      height: height ? height : "fit-content",
      maxHeight: "99vh",
      panelClass: ["addusermodal", "rounded-10", "overflow-hidden"],
      data
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result && result["isSave"]) {
        if (component == TeamcreationComponent) {
          this.teamChange.emit("UPDATE");
        }
        if (component == UsercreationComponent) {
          this.teamChange.emit("CREATE-USER");
          if (!this.userInfo.isAdmin) {
            this.cs.callFunction("USER-RELOAD");
          }
        }
      }
      console.log(result);
    });
  }
  deleteTeam(x) {
    return __async(this, null, function* () {
      let res = yield this.teamS.teamDelete({ nTeamid: x.nTeamid });
      if (res) {
        this.teamChange.emit("UPDATE");
      }
    });
  }
  static {
    this.\u0275fac = function TeamlistComponent_Factory(t) {
      return new (t || _TeamlistComponent)(\u0275\u0275directiveInject(TeamsetupService), \u0275\u0275directiveInject(MatDialog), \u0275\u0275directiveInject(SecureStorageService), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(CommunicationService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _TeamlistComponent, selectors: [["teamlist"]], inputs: { teamlist: "teamlist", nCaseid: "nCaseid", isloading: "isloading", nUTeamid: "nUTeamid" }, outputs: { teamChange: "teamChange" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 12, vars: 3, consts: [["t", "matMenuTrigger"], ["delete", "matMenu"], [1, "text-xs", "text-gray-400", "mb-2"], [1, "flex", "gap-2"], ["id", "teams", "cdkDropList", "", 1, "flex", "items-center", "gap-2", "w-full", "overflow-auto", 3, "cdkDropListData", "cdkDropListEnterPredicate"], ["cdkDrag", "", 1, "cdk-drag", "team", "group", "whitespace-nowrap", "cursor-grab", "active:cursor-grabbing", "select-none", "c-pointer", "h-8", "p-2.5", "flex", "items-center", "gap-2.5", "text-white", "text-xs", "rounded-lg", "w-fit", 3, "ngStyle"], ["mode", "dark", 1, "ms-auto", 3, "click"], ["name", "userfill", 1, "text-base"], ["name", "addfill", 1, "text-base"], ["mode", "dark", 3, "click"], ["height", "32px", "width", "110px"], ["cdkDrag", "", 1, "cdk-drag", "team", "group", "whitespace-nowrap", "cursor-grab", "active:cursor-grabbing", "select-none", "c-pointer", "h-8", "p-2.5", "flex", "items-center", "gap-2.5", "text-white", "text-xs", "rounded-lg", "w-fit", 3, "cdkDragStarted", "cdkDragMoved", "ngStyle"], ["name", "user"], ["class", "relative team group cursor-grabbing  h-8  p-2.5 flex items-center gap-2.5 text-white text-xs  rounded-lg w-fit", 3, "ngStyle", 4, "cdkDragPreview"], ["class", "relative team group c-pointer bg-gray-600 h-8  p-2.5 flex items-center gap-2.5 text-white text-xs  rounded-lg w-fit", 3, "ngStyle", 4, "cdkDragPlaceholder"], [1, "group-hover:flex", "gap-2.5", "text-mgray-700", "cursor-pointer", "text-white", 3, "ngClass"], ["matTooltip", "Edit", "matTooltipClass", "defaulttooltip", "matTooltipPosition", "below", "name", "edit", 1, "ms-2", "text-sm", 3, "click"], [1, "h-4", "w-px", "bg-mgray-600"], ["matTooltip", "Delete", "matTooltipClass", "defaulttooltip", "matTooltipPosition", "below", "name", "removefill", 1, "text-sm", 3, "matMenuTriggerFor"], [1, "!bg-black", "p-5", "rounded-base"], [1, "mb-6", "min-w-64", "text-white", "text-xs"], [3, "click"], ["mode", "dark"], [1, "relative", "team", "group", "cursor-grabbing", "h-8", "p-2.5", "flex", "items-center", "gap-2.5", "text-white", "text-xs", "rounded-lg", "w-fit", 3, "ngStyle"], ["name", "user", 1, "text-xs"], [1, "relative", "team", "group", "c-pointer", "bg-gray-600", "h-8", "p-2.5", "flex", "items-center", "gap-2.5", "text-white", "text-xs", "rounded-lg", "w-fit", 3, "ngStyle"]], template: function TeamlistComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "h6", 2);
        \u0275\u0275text(1, "Drag and drop a team onto the name to assign");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(2, "div", 3);
        \u0275\u0275template(3, TeamlistComponent_Conditional_3_Template, 3, 1, "div", 3);
        \u0275\u0275elementStart(4, "div", 4);
        \u0275\u0275repeaterCreate(5, TeamlistComponent_For_6_Template, 6, 5, "div", 5, \u0275\u0275repeaterTrackByIdentity);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(7, "btn", 6);
        \u0275\u0275listener("click", function TeamlistComponent_Template_btn_click_7_listener() {
          return ctx.createUser();
        });
        \u0275\u0275element(8, "icon", 7)(9, "icon", 8);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(10, "btn", 9);
        \u0275\u0275listener("click", function TeamlistComponent_Template_btn_click_10_listener() {
          return ctx.createTeam();
        });
        \u0275\u0275text(11, " New Team ");
        \u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        \u0275\u0275advance(3);
        \u0275\u0275conditional(3, ctx.isloading ? 3 : -1);
        \u0275\u0275advance();
        \u0275\u0275property("cdkDropListData", ctx.teamlist)("cdkDropListEnterPredicate", ctx.dropListPredicate());
        \u0275\u0275advance();
        \u0275\u0275repeater(ctx.teamlist);
      }
    }, dependencies: [CommonModule, NgClass, NgStyle, DragDropModule, CdkDropList, CdkDrag, CdkDragPreview, CdkDragPlaceholder, SkeletonComponent, MatDialogModule, IconComponent, ButtonComponent, MatMenuModule, MatMenu, MatMenuTrigger] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(TeamlistComponent, { className: "TeamlistComponent", filePath: "src\\app\\adminpanel\\components\\casebuilder\\teamlist\\teamlist.component.ts", lineNumber: 24 });
})();

// src/app/adminpanel/components/casebuilder/teamsetup/teamsetup.component.ts
var TeamsetupComponent = class _TeamsetupComponent {
  constructor(ss, dialog, teamS, route, caseS, hs, cf, cs, cdr, userPermissions) {
    this.ss = ss;
    this.dialog = dialog;
    this.teamS = teamS;
    this.route = route;
    this.caseS = caseS;
    this.hs = hs;
    this.cf = cf;
    this.cs = cs;
    this.cdr = cdr;
    this.userPermissions = userPermissions;
    this.scrolled = true;
    this.reached = true;
    this.isLoading = false;
    this.isloading = true;
    this.assignedusers = [];
    this.isTeamassign = false;
    this.refreshUser = false;
    var params = this.route.snapshot.params;
    params = JSON.parse(atob(params["id"]));
    this.nCaseid = params && params["id"] ? params["id"] : 0;
    userPermissions.userPermissionList(this.nCaseid);
    this.checkEventSub();
  }
  checkEventSub() {
    return __async(this, null, function* () {
      this.evsubscription = this.cs.functionCalled$.subscribe((data) => __async(this, null, function* () {
        if (data == "ROLE-PERMISSION") {
          var params = { id: this.nCaseid };
          this.cf.goto("/permission/rolepermission", params);
        } else if (data == "USER-PERMISSION") {
          var params = { id: this.nCaseid };
          this.cf.goto("/permission/userpermission", params);
        }
      }));
    });
  }
  ngOnDestroy() {
    this.evsubscription.unsubscribe();
  }
  ngAfterViewInit() {
    setTimeout(() => {
      this.hs.updatePath("team setup");
      this.hs.updateisCase(true);
    }, 10);
  }
  ngOnInit() {
    return __async(this, null, function* () {
      this.userDetail = yield this.ss.getUserInfo();
      if (this.nCaseid) {
        this.getTeamList();
        this.hs.Casedetail = yield this.getCaseDetail(this.nCaseid);
      }
    });
  }
  getCaseDetail(nCaseid) {
    return __async(this, null, function* () {
      let res = yield this.caseS.getCaseInfo(nCaseid);
      return res;
    });
  }
  getTeamList() {
    this.teamS.teamList(this.nCaseid).then((res) => {
      this.teamlist = res;
      this.isloading = false;
      this.getassignedUsers();
    });
  }
  getassignedUsers() {
    this.teamS.assignedUsers(this.nCaseid).then((res) => {
      this.assignedusers = res;
      if (this.assignedusers.find((e) => e.u == this.userDetail.nUserid)) {
        this.nUTeamid = this.assignedusers.find((e) => e.u == this.userDetail.nUserid).t;
      }
    });
  }
  onScroll(flag, ev) {
    this.reached = flag ? true : false;
  }
  setSearch($event) {
    console.log($event);
  }
  userChange(e) {
    if (e.type == "drag") {
      this.isTeamassign = true;
      this.dragteam = null;
      if (e.user && e.user.u && e.user.t) {
        var ind = this.assignedusers.findIndex((auser) => auser.u == e.user.u);
        if (ind > -1) {
          this.assignedusers[ind]["t"] = e.user.t;
        } else {
          this.assignedusers.push(e.user);
        }
      }
    }
    if (e.type == "dragrm") {
      this.isTeamassign = true;
      var ind = this.assignedusers.findIndex((auser) => auser.u == e.user.u);
      this.assignedusers.splice(ind, 1);
    }
  }
  teamChange(e) {
    if (e.type == "dragteam") {
      this.dragteam = e.dragteam;
      return;
    }
    if (e == "UPDATE") {
      this.teamS.teamList(this.nCaseid).then((res) => {
        this.teamlist = res;
      });
    } else if (e == "CREATE-USER") {
      this.getassignedUsers();
    }
    this.cdr.detectChanges();
  }
  getColor(cClr) {
    return cClr ? cClr.substring(0, 7).toUpperCase() : "";
  }
  static {
    this.UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  }
  /** Build the assignteam payload with only well-formed (UUID-shaped) rows.
   *  Logs anything dropped so upstream — wherever non-UUID `u`/`t` values are
   *  sneaking into `assignedusers` — can be traced. Cause is usually a stale
   *  draft user record or an entry pushed before the user was saved. */
  buildAssignTeamPayload() {
    const re = _TeamsetupComponent.UUID_RE;
    const valid = [];
    const dropped = [];
    for (const u of this.assignedusers) {
      if (re.test(u.u || "") && re.test(u.t || "")) {
        valid.push({ u: u.u, t: u.t });
      } else {
        dropped.push(u);
      }
    }
    if (dropped.length) {
      console.warn("[teamsetup] dropped non-UUID assignedusers rows:", dropped);
    }
    return { nCaseid: this.nCaseid, jUsers: valid };
  }
  submitTeam() {
    if (this.isTeamassign) {
      if (this.assignedusers.find((u) => u.u == this.userDetail.nUserid)) {
        this.isLoading = true;
        var params = this.buildAssignTeamPayload();
        this.teamS.assignTeam(params).then((res) => {
          if (res) {
            this.isLoading = false;
            this.cf.goto("managefiles/bundlemanagement", { id: this.nCaseid });
          }
        });
      } else {
        this.openalert((data) => {
          if (data.res) {
            this.isLoading = true;
            var params2 = this.buildAssignTeamPayload();
            this.teamS.assignTeam(params2).then((res) => {
              if (res) {
                this.isLoading = false;
                this.cf.goto("managefiles/bundlemanagement", { id: this.nCaseid });
              }
            });
          }
        });
      }
    } else {
      this.isLoading = false;
      this.skip();
    }
  }
  skip() {
    if (!this.assignedusers.find((auser) => auser.u == this.userDetail.nUserid)) {
      this.openalert((data) => {
        if (data.res) {
          this.cf.goto("managefiles/bundlemanagement", { id: this.nCaseid });
        }
      });
    } else {
      this.cf.goto("managefiles/bundlemanagement", { id: this.nCaseid });
    }
  }
  openalert(cb) {
    const dialogRef = this.dialog.open(DialogueComponent, {
      width: "fit-content",
      minWidth: "500px",
      height: "fit-content",
      data: {
        "type": "E",
        // 'I'
        "heading": "Assign yourself first for a full access to this case",
        "desc": "To access dashboard, upload and make edits.",
        "button1": "I will do it now",
        "button2": "Go to HearingHub",
        "bt1res": false,
        "bt2res": true,
        "checkbox": "Don\u2019t show this again."
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      cb(result);
    });
  }
  static {
    this.\u0275fac = function TeamsetupComponent_Factory(t) {
      return new (t || _TeamsetupComponent)(\u0275\u0275directiveInject(SecureStorageService), \u0275\u0275directiveInject(MatDialog), \u0275\u0275directiveInject(TeamsetupService), \u0275\u0275directiveInject(ActivatedRoute), \u0275\u0275directiveInject(CasedetailService), \u0275\u0275directiveInject(HeaderService), \u0275\u0275directiveInject(CommonfunctionService), \u0275\u0275directiveInject(CommunicationService), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(UserPermissionService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _TeamsetupComponent, selectors: [["app-teamsetup"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 11, vars: 9, consts: [["cdkDropListGroup", "", 1, "bg-dark-blue", "p-10", "h-full", "overflow-hidden", "flex", "flex-col"], [1, "top", "mb-6"], [3, "teamChange", "teamlist", "nCaseid", "isloading", "nUTeamid"], [1, "h-full", "overflow-hidden", "mt-2.5"], [3, "userChange", "nCaseid", "teamlist", "dragteam", "assignedusers"], [1, "row", "mt-6"], [1, "col-lg-3", "flex", "gap-3"], ["type", "submit", "mode", "gradient", "addcls", "rounded-full", 3, "click", "isloading"], ["type", "submit", "mode", "dark", "addcls", "rounded-full bg-white text-blue-on px-4", 3, "click"]], template: function TeamsetupComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "teamlist", 2);
        \u0275\u0275listener("teamChange", function TeamsetupComponent_Template_teamlist_teamChange_2_listener($event) {
          return ctx.teamChange($event);
        });
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(3, "div", 3)(4, "userlist", 4);
        \u0275\u0275listener("userChange", function TeamsetupComponent_Template_userlist_userChange_4_listener($event) {
          return ctx.userChange($event);
        });
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(5, "div", 5)(6, "div", 6)(7, "btn", 7);
        \u0275\u0275listener("click", function TeamsetupComponent_Template_btn_click_7_listener() {
          return ctx.submitTeam();
        });
        \u0275\u0275text(8, " Save and go to File ");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(9, "btn", 8);
        \u0275\u0275listener("click", function TeamsetupComponent_Template_btn_click_9_listener() {
          return ctx.skip();
        });
        \u0275\u0275text(10, " Skip ");
        \u0275\u0275elementEnd()()()();
      }
      if (rf & 2) {
        \u0275\u0275advance(2);
        \u0275\u0275property("teamlist", ctx.teamlist)("nCaseid", ctx.nCaseid)("isloading", ctx.isloading)("nUTeamid", ctx.nUTeamid);
        \u0275\u0275advance(2);
        \u0275\u0275property("nCaseid", ctx.nCaseid)("teamlist", ctx.teamlist)("dragteam", ctx.dragteam)("assignedusers", ctx.assignedusers);
        \u0275\u0275advance(3);
        \u0275\u0275property("isloading", ctx.isLoading);
      }
    }, dependencies: [
      CommonModule,
      FormsModule,
      ButtonComponent,
      UserlistComponent,
      TeamlistComponent,
      CdkDropListGroup
    ], styles: ["\n\nbody.dragging[_ngcontent-%COMP%] {\n  cursor: pointer !important;\n}\n/*# sourceMappingURL=teamsetup.component.css.map */"] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(TeamsetupComponent, { className: "TeamsetupComponent", filePath: "src\\app\\adminpanel\\components\\casebuilder\\teamsetup\\teamsetup.component.ts", lineNumber: 30 });
})();
export {
  TeamsetupComponent
};
//# sourceMappingURL=chunk-IVI7NLYG.js.map
