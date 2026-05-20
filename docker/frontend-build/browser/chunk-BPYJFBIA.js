import {
  ContactService
} from "./chunk-5HHWKW4L.js";
import {
  NgScrollbar,
  NgScrollbarModule
} from "./chunk-WZNPCXMG.js";
import {
  TranslateModule,
  TranslatePipe,
  TranslateService
} from "./chunk-DWVFAK3Q.js";
import {
  CommonfunctionService
} from "./chunk-TNIBXRF4.js";
import {
  MatCheckbox,
  MatCheckboxModule
} from "./chunk-QZYXJIJ7.js";
import {
  FormsModule,
  NgControlStatus,
  NgModel
} from "./chunk-CIO7JDBK.js";
import {
  environment
} from "./chunk-UA722RUW.js";
import {
  CommonModule,
  NgClass,
  NgForOf,
  NgIf,
  NgTemplateOutlet
} from "./chunk-YBHDQMOW.js";
import {
  ChangeDetectorRef,
  EventEmitter,
  __async,
  __commonJS,
  __toESM,
  ɵsetClassDebugInfo,
  ɵɵNgOnChangesFeature,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵdefineComponent,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementContainer,
  ɵɵelementContainerEnd,
  ɵɵelementContainerStart,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵloadQuery,
  ɵɵnextContext,
  ɵɵpipe,
  ɵɵpipeBind1,
  ɵɵproperty,
  ɵɵpureFunction1,
  ɵɵpureFunction4,
  ɵɵqueryRefresh,
  ɵɵreference,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵsanitizeHtml,
  ɵɵtemplate,
  ɵɵtemplateRefExtractor,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty,
  ɵɵviewQuery
} from "./chunk-OLJKHPOW.js";

// node_modules/tributejs/dist/tribute.min.js
var require_tribute_min = __commonJS({
  "node_modules/tributejs/dist/tribute.min.js"(exports, module) {
    "use strict";
    !function(e, t) {
      "object" == typeof exports && "undefined" != typeof module ? module.exports = t() : "function" == typeof define && define.amd ? define(t) : (e = e || self).Tribute = t();
    }(exports, function() {
      "use strict";
      function e(e2, t2) {
        if (!(e2 instanceof t2))
          throw new TypeError("Cannot call a class as a function");
      }
      function t(e2, t2) {
        for (var n2 = 0; n2 < t2.length; n2++) {
          var i2 = t2[n2];
          i2.enumerable = i2.enumerable || false, i2.configurable = true, "value" in i2 && (i2.writable = true), Object.defineProperty(e2, i2.key, i2);
        }
      }
      function n(e2, n2, i2) {
        return n2 && t(e2.prototype, n2), i2 && t(e2, i2), e2;
      }
      function i(e2, t2) {
        return function(e3) {
          if (Array.isArray(e3))
            return e3;
        }(e2) || function(e3, t3) {
          if (!(Symbol.iterator in Object(e3) || "[object Arguments]" === Object.prototype.toString.call(e3)))
            return;
          var n2 = [], i2 = true, r2 = false, o2 = void 0;
          try {
            for (var u2, l2 = e3[Symbol.iterator](); !(i2 = (u2 = l2.next()).done) && (n2.push(u2.value), !t3 || n2.length !== t3); i2 = true)
              ;
          } catch (e4) {
            r2 = true, o2 = e4;
          } finally {
            try {
              i2 || null == l2.return || l2.return();
            } finally {
              if (r2)
                throw o2;
            }
          }
          return n2;
        }(e2, t2) || function() {
          throw new TypeError("Invalid attempt to destructure non-iterable instance");
        }();
      }
      if (Array.prototype.find || (Array.prototype.find = function(e2) {
        if (null === this)
          throw new TypeError("Array.prototype.find called on null or undefined");
        if ("function" != typeof e2)
          throw new TypeError("predicate must be a function");
        for (var t2, n2 = Object(this), i2 = n2.length >>> 0, r2 = arguments[1], o2 = 0; o2 < i2; o2++)
          if (t2 = n2[o2], e2.call(r2, t2, o2, n2))
            return t2;
      }), window && "function" != typeof window.CustomEvent) {
        var r = function(e2, t2) {
          t2 = t2 || { bubbles: false, cancelable: false, detail: void 0 };
          var n2 = document.createEvent("CustomEvent");
          return n2.initCustomEvent(e2, t2.bubbles, t2.cancelable, t2.detail), n2;
        };
        void 0 !== window.Event && (r.prototype = window.Event.prototype), window.CustomEvent = r;
      }
      var o = function() {
        function t2(n2) {
          e(this, t2), this.tribute = n2, this.tribute.events = this;
        }
        return n(t2, [{ key: "bind", value: function(e2) {
          e2.boundKeydown = this.keydown.bind(e2, this), e2.boundKeyup = this.keyup.bind(e2, this), e2.boundInput = this.input.bind(e2, this), e2.addEventListener("keydown", e2.boundKeydown, false), e2.addEventListener("keyup", e2.boundKeyup, false), e2.addEventListener("input", e2.boundInput, false);
        } }, { key: "unbind", value: function(e2) {
          e2.removeEventListener("keydown", e2.boundKeydown, false), e2.removeEventListener("keyup", e2.boundKeyup, false), e2.removeEventListener("input", e2.boundInput, false), delete e2.boundKeydown, delete e2.boundKeyup, delete e2.boundInput;
        } }, { key: "keydown", value: function(e2, n2) {
          e2.shouldDeactivate(n2) && (e2.tribute.isActive = false, e2.tribute.hideMenu());
          var i2 = this;
          e2.commandEvent = false, t2.keys().forEach(function(t3) {
            t3.key === n2.keyCode && (e2.commandEvent = true, e2.callbacks()[t3.value.toLowerCase()](n2, i2));
          });
        } }, { key: "input", value: function(e2, t3) {
          e2.inputEvent = true, e2.keyup.call(this, e2, t3);
        } }, { key: "click", value: function(e2, t3) {
          var n2 = e2.tribute;
          if (n2.menu && n2.menu.contains(t3.target)) {
            var i2 = t3.target;
            for (t3.preventDefault(), t3.stopPropagation(); "li" !== i2.nodeName.toLowerCase(); )
              if (!(i2 = i2.parentNode) || i2 === n2.menu)
                throw new Error("cannot find the <li> container for the click");
            n2.selectItemAtIndex(i2.getAttribute("data-index"), t3), n2.hideMenu();
          } else
            n2.current.element && !n2.current.externalTrigger && (n2.current.externalTrigger = false, setTimeout(function() {
              return n2.hideMenu();
            }));
        } }, { key: "keyup", value: function(e2, t3) {
          if (e2.inputEvent && (e2.inputEvent = false), e2.updateSelection(this), 27 !== t3.keyCode) {
            if (!e2.tribute.allowSpaces && e2.tribute.hasTrailingSpace)
              return e2.tribute.hasTrailingSpace = false, e2.commandEvent = true, void e2.callbacks().space(t3, this);
            if (!e2.tribute.isActive)
              if (e2.tribute.autocompleteMode)
                e2.callbacks().triggerChar(t3, this, "");
              else {
                var n2 = e2.getKeyCode(e2, this, t3);
                if (isNaN(n2) || !n2)
                  return;
                var i2 = e2.tribute.triggers().find(function(e3) {
                  return e3.charCodeAt(0) === n2;
                });
                void 0 !== i2 && e2.callbacks().triggerChar(t3, this, i2);
              }
            e2.tribute.current.mentionText.length < e2.tribute.current.collection.menuShowMinLength || ((e2.tribute.current.trigger || e2.tribute.autocompleteMode) && false === e2.commandEvent || e2.tribute.isActive && 8 === t3.keyCode) && e2.tribute.showMenuFor(this, true);
          }
        } }, { key: "shouldDeactivate", value: function(e2) {
          if (!this.tribute.isActive)
            return false;
          if (0 === this.tribute.current.mentionText.length) {
            var n2 = false;
            return t2.keys().forEach(function(t3) {
              e2.keyCode === t3.key && (n2 = true);
            }), !n2;
          }
          return false;
        } }, { key: "getKeyCode", value: function(e2, t3, n2) {
          var i2 = e2.tribute, r2 = i2.range.getTriggerInfo(false, i2.hasTrailingSpace, true, i2.allowSpaces, i2.autocompleteMode);
          return !!r2 && r2.mentionTriggerChar.charCodeAt(0);
        } }, { key: "updateSelection", value: function(e2) {
          this.tribute.current.element = e2;
          var t3 = this.tribute.range.getTriggerInfo(false, this.tribute.hasTrailingSpace, true, this.tribute.allowSpaces, this.tribute.autocompleteMode);
          t3 && (this.tribute.current.selectedPath = t3.mentionSelectedPath, this.tribute.current.mentionText = t3.mentionText, this.tribute.current.selectedOffset = t3.mentionSelectedOffset);
        } }, { key: "callbacks", value: function() {
          var e2 = this;
          return { triggerChar: function(t3, n2, i2) {
            var r2 = e2.tribute;
            r2.current.trigger = i2;
            var o2 = r2.collection.find(function(e3) {
              return e3.trigger === i2;
            });
            r2.current.collection = o2, r2.current.mentionText.length >= r2.current.collection.menuShowMinLength && r2.inputEvent && r2.showMenuFor(n2, true);
          }, enter: function(t3, n2) {
            e2.tribute.isActive && e2.tribute.current.filteredItems && (t3.preventDefault(), t3.stopPropagation(), setTimeout(function() {
              e2.tribute.selectItemAtIndex(e2.tribute.menuSelected, t3), e2.tribute.hideMenu();
            }, 0));
          }, escape: function(t3, n2) {
            e2.tribute.isActive && (t3.preventDefault(), t3.stopPropagation(), e2.tribute.isActive = false, e2.tribute.hideMenu());
          }, tab: function(t3, n2) {
            e2.callbacks().enter(t3, n2);
          }, space: function(t3, n2) {
            e2.tribute.isActive && (e2.tribute.spaceSelectsMatch ? e2.callbacks().enter(t3, n2) : e2.tribute.allowSpaces || (t3.stopPropagation(), setTimeout(function() {
              e2.tribute.hideMenu(), e2.tribute.isActive = false;
            }, 0)));
          }, up: function(t3, n2) {
            if (e2.tribute.isActive && e2.tribute.current.filteredItems) {
              t3.preventDefault(), t3.stopPropagation();
              var i2 = e2.tribute.current.filteredItems.length, r2 = e2.tribute.menuSelected;
              i2 > r2 && r2 > 0 ? (e2.tribute.menuSelected--, e2.setActiveLi()) : 0 === r2 && (e2.tribute.menuSelected = i2 - 1, e2.setActiveLi(), e2.tribute.menu.scrollTop = e2.tribute.menu.scrollHeight);
            }
          }, down: function(t3, n2) {
            if (e2.tribute.isActive && e2.tribute.current.filteredItems) {
              t3.preventDefault(), t3.stopPropagation();
              var i2 = e2.tribute.current.filteredItems.length - 1, r2 = e2.tribute.menuSelected;
              i2 > r2 ? (e2.tribute.menuSelected++, e2.setActiveLi()) : i2 === r2 && (e2.tribute.menuSelected = 0, e2.setActiveLi(), e2.tribute.menu.scrollTop = 0);
            }
          }, delete: function(t3, n2) {
            e2.tribute.isActive && e2.tribute.current.mentionText.length < 1 ? e2.tribute.hideMenu() : e2.tribute.isActive && e2.tribute.showMenuFor(n2);
          } };
        } }, { key: "setActiveLi", value: function(e2) {
          var t3 = this.tribute.menu.querySelectorAll("li"), n2 = t3.length >>> 0;
          e2 && (this.tribute.menuSelected = parseInt(e2));
          for (var i2 = 0; i2 < n2; i2++) {
            var r2 = t3[i2];
            if (i2 === this.tribute.menuSelected) {
              r2.classList.add(this.tribute.current.collection.selectClass);
              var o2 = r2.getBoundingClientRect(), u2 = this.tribute.menu.getBoundingClientRect();
              if (o2.bottom > u2.bottom) {
                var l2 = o2.bottom - u2.bottom;
                this.tribute.menu.scrollTop += l2;
              } else if (o2.top < u2.top) {
                var s2 = u2.top - o2.top;
                this.tribute.menu.scrollTop -= s2;
              }
            } else
              r2.classList.remove(this.tribute.current.collection.selectClass);
          }
        } }, { key: "getFullHeight", value: function(e2, t3) {
          var n2 = e2.getBoundingClientRect().height;
          if (t3) {
            var i2 = e2.currentStyle || window.getComputedStyle(e2);
            return n2 + parseFloat(i2.marginTop) + parseFloat(i2.marginBottom);
          }
          return n2;
        } }], [{ key: "keys", value: function() {
          return [{ key: 9, value: "TAB" }, { key: 8, value: "DELETE" }, { key: 13, value: "ENTER" }, { key: 27, value: "ESCAPE" }, { key: 32, value: "SPACE" }, { key: 38, value: "UP" }, { key: 40, value: "DOWN" }];
        } }]), t2;
      }(), u = function() {
        function t2(n2) {
          e(this, t2), this.tribute = n2, this.tribute.menuEvents = this, this.menu = this.tribute.menu;
        }
        return n(t2, [{ key: "bind", value: function(e2) {
          var t3 = this;
          this.menuClickEvent = this.tribute.events.click.bind(null, this), this.menuContainerScrollEvent = this.debounce(function() {
            t3.tribute.isActive && t3.tribute.showMenuFor(t3.tribute.current.element, false);
          }, 300, false), this.windowResizeEvent = this.debounce(function() {
            t3.tribute.isActive && t3.tribute.range.positionMenuAtCaret(true);
          }, 300, false), this.tribute.range.getDocument().addEventListener("MSPointerDown", this.menuClickEvent, false), this.tribute.range.getDocument().addEventListener("mousedown", this.menuClickEvent, false), window.addEventListener("resize", this.windowResizeEvent), this.menuContainer ? this.menuContainer.addEventListener("scroll", this.menuContainerScrollEvent, false) : window.addEventListener("scroll", this.menuContainerScrollEvent);
        } }, { key: "unbind", value: function(e2) {
          this.tribute.range.getDocument().removeEventListener("mousedown", this.menuClickEvent, false), this.tribute.range.getDocument().removeEventListener("MSPointerDown", this.menuClickEvent, false), window.removeEventListener("resize", this.windowResizeEvent), this.menuContainer ? this.menuContainer.removeEventListener("scroll", this.menuContainerScrollEvent, false) : window.removeEventListener("scroll", this.menuContainerScrollEvent);
        } }, { key: "debounce", value: function(e2, t3, n2) {
          var i2, r2 = arguments, o2 = this;
          return function() {
            var u2 = o2, l2 = r2, s2 = n2 && !i2;
            clearTimeout(i2), i2 = setTimeout(function() {
              i2 = null, n2 || e2.apply(u2, l2);
            }, t3), s2 && e2.apply(u2, l2);
          };
        } }]), t2;
      }(), l = function() {
        function t2(n2) {
          e(this, t2), this.tribute = n2, this.tribute.range = this;
        }
        return n(t2, [{ key: "getDocument", value: function() {
          var e2;
          return this.tribute.current.collection && (e2 = this.tribute.current.collection.iframe), e2 ? e2.contentWindow.document : document;
        } }, { key: "positionMenuAtCaret", value: function(e2) {
          var t3, n2 = this, i2 = this.tribute.current, r2 = this.getTriggerInfo(false, this.tribute.hasTrailingSpace, true, this.tribute.allowSpaces, this.tribute.autocompleteMode);
          if (void 0 !== r2) {
            if (!this.tribute.positionMenu)
              return void (this.tribute.menu.style.cssText = "display: block;");
            t3 = this.isContentEditable(i2.element) ? this.getContentEditableCaretPosition(r2.mentionPosition) : this.getTextAreaOrInputUnderlinePosition(this.tribute.current.element, r2.mentionPosition), this.tribute.menu.style.cssText = "top: ".concat(t3.top, "px;\n                                     left: ").concat(t3.left, "px;\n                                     right: ").concat(t3.right, "px;\n                                     bottom: ").concat(t3.bottom, "px;\n                                     position: absolute;\n                                     display: block;"), "auto" === t3.left && (this.tribute.menu.style.left = "auto"), "auto" === t3.top && (this.tribute.menu.style.top = "auto"), e2 && this.scrollIntoView(), window.setTimeout(function() {
              var i3 = { width: n2.tribute.menu.offsetWidth, height: n2.tribute.menu.offsetHeight }, r3 = n2.isMenuOffScreen(t3, i3), o2 = window.innerWidth > i3.width && (r3.left || r3.right), u2 = window.innerHeight > i3.height && (r3.top || r3.bottom);
              (o2 || u2) && (n2.tribute.menu.style.cssText = "display: none", n2.positionMenuAtCaret(e2));
            }, 0);
          } else
            this.tribute.menu.style.cssText = "display: none";
        } }, { key: "selectElement", value: function(e2, t3, n2) {
          var i2, r2 = e2;
          if (t3)
            for (var o2 = 0; o2 < t3.length; o2++) {
              if (void 0 === (r2 = r2.childNodes[t3[o2]]))
                return;
              for (; r2.length < n2; )
                n2 -= r2.length, r2 = r2.nextSibling;
              0 !== r2.childNodes.length || r2.length || (r2 = r2.previousSibling);
            }
          var u2 = this.getWindowSelection();
          (i2 = this.getDocument().createRange()).setStart(r2, n2), i2.setEnd(r2, n2), i2.collapse(true);
          try {
            u2.removeAllRanges();
          } catch (e3) {
          }
          u2.addRange(i2), e2.focus();
        } }, { key: "replaceTriggerText", value: function(e2, t3, n2, i2, r2) {
          var o2 = this.getTriggerInfo(true, n2, t3, this.tribute.allowSpaces, this.tribute.autocompleteMode);
          if (void 0 !== o2) {
            var u2 = this.tribute.current, l2 = new CustomEvent("tribute-replaced", { detail: { item: r2, instance: u2, context: o2, event: i2 } });
            if (this.isContentEditable(u2.element)) {
              e2 += "string" == typeof this.tribute.replaceTextSuffix ? this.tribute.replaceTextSuffix : "\xA0";
              var s2 = o2.mentionPosition + o2.mentionText.length;
              this.tribute.autocompleteMode || (s2 += o2.mentionTriggerChar.length), this.pasteHtml(e2, o2.mentionPosition, s2);
            } else {
              var a = this.tribute.current.element, c = "string" == typeof this.tribute.replaceTextSuffix ? this.tribute.replaceTextSuffix : " ";
              e2 += c;
              var h = o2.mentionPosition, d = o2.mentionPosition + o2.mentionText.length + c.length;
              this.tribute.autocompleteMode || (d += o2.mentionTriggerChar.length - 1), a.value = a.value.substring(0, h) + e2 + a.value.substring(d, a.value.length), a.selectionStart = h + e2.length, a.selectionEnd = h + e2.length;
            }
            u2.element.dispatchEvent(new CustomEvent("input", { bubbles: true })), u2.element.dispatchEvent(l2);
          }
        } }, { key: "pasteHtml", value: function(e2, t3, n2) {
          var i2, r2;
          r2 = this.getWindowSelection(), (i2 = this.getDocument().createRange()).setStart(r2.anchorNode, t3), i2.setEnd(r2.anchorNode, n2), i2.deleteContents();
          var o2 = this.getDocument().createElement("div");
          o2.innerHTML = e2;
          for (var u2, l2, s2 = this.getDocument().createDocumentFragment(); u2 = o2.firstChild; )
            l2 = s2.appendChild(u2);
          i2.insertNode(s2), l2 && ((i2 = i2.cloneRange()).setStartAfter(l2), i2.collapse(true), r2.removeAllRanges(), r2.addRange(i2));
        } }, { key: "getWindowSelection", value: function() {
          return this.tribute.collection.iframe ? this.tribute.collection.iframe.contentWindow.getSelection() : window.getSelection();
        } }, { key: "getNodePositionInParent", value: function(e2) {
          if (null === e2.parentNode)
            return 0;
          for (var t3 = 0; t3 < e2.parentNode.childNodes.length; t3++) {
            if (e2.parentNode.childNodes[t3] === e2)
              return t3;
          }
        } }, { key: "getContentEditableSelectedPath", value: function(e2) {
          var t3 = this.getWindowSelection(), n2 = t3.anchorNode, i2 = [];
          if (null != n2) {
            for (var r2, o2 = n2.contentEditable; null !== n2 && "true" !== o2; )
              r2 = this.getNodePositionInParent(n2), i2.push(r2), null !== (n2 = n2.parentNode) && (o2 = n2.contentEditable);
            return i2.reverse(), { selected: n2, path: i2, offset: t3.getRangeAt(0).startOffset };
          }
        } }, { key: "getTextPrecedingCurrentSelection", value: function() {
          var e2 = this.tribute.current, t3 = "";
          if (this.isContentEditable(e2.element)) {
            var n2 = this.getWindowSelection().anchorNode;
            if (null != n2) {
              var i2 = n2.textContent, r2 = this.getWindowSelection().getRangeAt(0).startOffset;
              i2 && r2 >= 0 && (t3 = i2.substring(0, r2));
            }
          } else {
            var o2 = this.tribute.current.element;
            if (o2) {
              var u2 = o2.selectionStart;
              o2.value && u2 >= 0 && (t3 = o2.value.substring(0, u2));
            }
          }
          return t3;
        } }, { key: "getLastWordInText", value: function(e2) {
          var t3 = (e2 = e2.replace(/\u00A0/g, " ")).split(/\s+/);
          return t3[t3.length - 1].trim();
        } }, { key: "getTriggerInfo", value: function(e2, t3, n2, i2, r2) {
          var o2, u2, l2, s2 = this, a = this.tribute.current;
          if (this.isContentEditable(a.element)) {
            var c = this.getContentEditableSelectedPath(a);
            c && (o2 = c.selected, u2 = c.path, l2 = c.offset);
          } else
            o2 = this.tribute.current.element;
          var h = this.getTextPrecedingCurrentSelection(), d = this.getLastWordInText(h);
          if (r2)
            return { mentionPosition: h.length - d.length, mentionText: d, mentionSelectedElement: o2, mentionSelectedPath: u2, mentionSelectedOffset: l2 };
          if (null != h) {
            var f, m = -1;
            if (this.tribute.collection.forEach(function(e3) {
              var t4 = e3.trigger, i3 = e3.requireLeadingSpace ? s2.lastIndexWithLeadingSpace(h, t4) : h.lastIndexOf(t4);
              i3 > m && (m = i3, f = t4, n2 = e3.requireLeadingSpace);
            }), m >= 0 && (0 === m || !n2 || /[\xA0\s]/g.test(h.substring(m - 1, m)))) {
              var p = h.substring(m + f.length, h.length);
              f = h.substring(m, m + f.length);
              var v = p.substring(0, 1), g = p.length > 0 && (" " === v || "\xA0" === v);
              t3 && (p = p.trim());
              var b = i2 ? /[^\S ]/g : /[\xA0\s]/g;
              if (this.tribute.hasTrailingSpace = b.test(p), !g && (e2 || !b.test(p)))
                return { mentionPosition: m, mentionText: p, mentionSelectedElement: o2, mentionSelectedPath: u2, mentionSelectedOffset: l2, mentionTriggerChar: f };
            }
          }
        } }, { key: "lastIndexWithLeadingSpace", value: function(e2, t3) {
          for (var n2 = e2.split("").reverse().join(""), i2 = -1, r2 = 0, o2 = e2.length; r2 < o2; r2++) {
            for (var u2 = r2 === e2.length - 1, l2 = /\s/.test(n2[r2 + 1]), s2 = true, a = t3.length - 1; a >= 0; a--)
              if (t3[a] !== n2[r2 - a]) {
                s2 = false;
                break;
              }
            if (s2 && (u2 || l2)) {
              i2 = e2.length - 1 - r2;
              break;
            }
          }
          return i2;
        } }, { key: "isContentEditable", value: function(e2) {
          return "INPUT" !== e2.nodeName && "TEXTAREA" !== e2.nodeName;
        } }, { key: "isMenuOffScreen", value: function(e2, t3) {
          var n2 = window.innerWidth, i2 = window.innerHeight, r2 = document.documentElement, o2 = (window.pageXOffset || r2.scrollLeft) - (r2.clientLeft || 0), u2 = (window.pageYOffset || r2.scrollTop) - (r2.clientTop || 0), l2 = "number" == typeof e2.top ? e2.top : u2 + i2 - e2.bottom - t3.height, s2 = "number" == typeof e2.right ? e2.right : e2.left + t3.width, a = "number" == typeof e2.bottom ? e2.bottom : e2.top + t3.height, c = "number" == typeof e2.left ? e2.left : o2 + n2 - e2.right - t3.width;
          return { top: l2 < Math.floor(u2), right: s2 > Math.ceil(o2 + n2), bottom: a > Math.ceil(u2 + i2), left: c < Math.floor(o2) };
        } }, { key: "getMenuDimensions", value: function() {
          var e2 = { width: null, height: null };
          return this.tribute.menu.style.cssText = "top: 0px;\n                                 left: 0px;\n                                 position: fixed;\n                                 display: block;\n                                 visibility; hidden;", e2.width = this.tribute.menu.offsetWidth, e2.height = this.tribute.menu.offsetHeight, this.tribute.menu.style.cssText = "display: none;", e2;
        } }, { key: "getTextAreaOrInputUnderlinePosition", value: function(e2, t3, n2) {
          var i2 = null !== window.mozInnerScreenX, r2 = this.getDocument().createElement("div");
          r2.id = "input-textarea-caret-position-mirror-div", this.getDocument().body.appendChild(r2);
          var o2 = r2.style, u2 = window.getComputedStyle ? getComputedStyle(e2) : e2.currentStyle;
          o2.whiteSpace = "pre-wrap", "INPUT" !== e2.nodeName && (o2.wordWrap = "break-word"), o2.position = "absolute", o2.visibility = "hidden", ["direction", "boxSizing", "width", "height", "overflowX", "overflowY", "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "fontStyle", "fontVariant", "fontWeight", "fontStretch", "fontSize", "fontSizeAdjust", "lineHeight", "fontFamily", "textAlign", "textTransform", "textIndent", "textDecoration", "letterSpacing", "wordSpacing"].forEach(function(e3) {
            o2[e3] = u2[e3];
          }), i2 ? (o2.width = "".concat(parseInt(u2.width) - 2, "px"), e2.scrollHeight > parseInt(u2.height) && (o2.overflowY = "scroll")) : o2.overflow = "hidden", r2.textContent = e2.value.substring(0, t3), "INPUT" === e2.nodeName && (r2.textContent = r2.textContent.replace(/\s/g, "\xA0"));
          var l2 = this.getDocument().createElement("span");
          l2.textContent = e2.value.substring(t3) || ".", r2.appendChild(l2);
          var s2 = e2.getBoundingClientRect(), a = document.documentElement, c = (window.pageXOffset || a.scrollLeft) - (a.clientLeft || 0), h = (window.pageYOffset || a.scrollTop) - (a.clientTop || 0), d = 0, f = 0;
          this.menuContainerIsBody && (d = s2.top, f = s2.left);
          var m = { top: d + h + l2.offsetTop + parseInt(u2.borderTopWidth) + parseInt(u2.fontSize) - e2.scrollTop, left: f + c + l2.offsetLeft + parseInt(u2.borderLeftWidth) }, p = window.innerWidth, v = window.innerHeight, g = this.getMenuDimensions(), b = this.isMenuOffScreen(m, g);
          b.right && (m.right = p - m.left, m.left = "auto");
          var y = this.tribute.menuContainer ? this.tribute.menuContainer.offsetHeight : this.getDocument().body.offsetHeight;
          if (b.bottom) {
            var w = y - (v - (this.tribute.menuContainer ? this.tribute.menuContainer.getBoundingClientRect() : this.getDocument().body.getBoundingClientRect()).top);
            m.bottom = w + (v - s2.top - l2.offsetTop), m.top = "auto";
          }
          return (b = this.isMenuOffScreen(m, g)).left && (m.left = p > g.width ? c + p - g.width : c, delete m.right), b.top && (m.top = v > g.height ? h + v - g.height : h, delete m.bottom), this.getDocument().body.removeChild(r2), m;
        } }, { key: "getContentEditableCaretPosition", value: function(e2) {
          var t3, n2 = this.getWindowSelection();
          (t3 = this.getDocument().createRange()).setStart(n2.anchorNode, e2), t3.setEnd(n2.anchorNode, e2), t3.collapse(false);
          var i2 = t3.getBoundingClientRect(), r2 = document.documentElement, o2 = (window.pageXOffset || r2.scrollLeft) - (r2.clientLeft || 0), u2 = (window.pageYOffset || r2.scrollTop) - (r2.clientTop || 0), l2 = { left: i2.left + o2, top: i2.top + i2.height + u2 }, s2 = window.innerWidth, a = window.innerHeight, c = this.getMenuDimensions(), h = this.isMenuOffScreen(l2, c);
          h.right && (l2.left = "auto", l2.right = s2 - i2.left - o2);
          var d = this.tribute.menuContainer ? this.tribute.menuContainer.offsetHeight : this.getDocument().body.offsetHeight;
          if (h.bottom) {
            var f = d - (a - (this.tribute.menuContainer ? this.tribute.menuContainer.getBoundingClientRect() : this.getDocument().body.getBoundingClientRect()).top);
            l2.top = "auto", l2.bottom = f + (a - i2.top);
          }
          return (h = this.isMenuOffScreen(l2, c)).left && (l2.left = s2 > c.width ? o2 + s2 - c.width : o2, delete l2.right), h.top && (l2.top = a > c.height ? u2 + a - c.height : u2, delete l2.bottom), this.menuContainerIsBody || (l2.left = l2.left ? l2.left - this.tribute.menuContainer.offsetLeft : l2.left, l2.top = l2.top ? l2.top - this.tribute.menuContainer.offsetTop : l2.top), l2;
        } }, { key: "scrollIntoView", value: function(e2) {
          var t3, n2 = this.menu;
          if (void 0 !== n2) {
            for (; void 0 === t3 || 0 === t3.height; )
              if (0 === (t3 = n2.getBoundingClientRect()).height && (void 0 === (n2 = n2.childNodes[0]) || !n2.getBoundingClientRect))
                return;
            var i2 = t3.top, r2 = i2 + t3.height;
            if (i2 < 0)
              window.scrollTo(0, window.pageYOffset + t3.top - 20);
            else if (r2 > window.innerHeight) {
              var o2 = window.pageYOffset + t3.top - 20;
              o2 - window.pageYOffset > 100 && (o2 = window.pageYOffset + 100);
              var u2 = window.pageYOffset - (window.innerHeight - r2);
              u2 > o2 && (u2 = o2), window.scrollTo(0, u2);
            }
          }
        } }, { key: "menuContainerIsBody", get: function() {
          return this.tribute.menuContainer === document.body || !this.tribute.menuContainer;
        } }]), t2;
      }(), s = function() {
        function t2(n2) {
          e(this, t2), this.tribute = n2, this.tribute.search = this;
        }
        return n(t2, [{ key: "simpleFilter", value: function(e2, t3) {
          var n2 = this;
          return t3.filter(function(t4) {
            return n2.test(e2, t4);
          });
        } }, { key: "test", value: function(e2, t3) {
          return null !== this.match(e2, t3);
        } }, { key: "match", value: function(e2, t3, n2) {
          n2 = n2 || {};
          t3.length;
          var i2 = n2.pre || "", r2 = n2.post || "", o2 = n2.caseSensitive && t3 || t3.toLowerCase();
          if (n2.skip)
            return { rendered: t3, score: 0 };
          e2 = n2.caseSensitive && e2 || e2.toLowerCase();
          var u2 = this.traverse(o2, e2, 0, 0, []);
          return u2 ? { rendered: this.render(t3, u2.cache, i2, r2), score: u2.score } : null;
        } }, { key: "traverse", value: function(e2, t3, n2, i2, r2) {
          if (t3.length === i2)
            return { score: this.calculateScore(r2), cache: r2.slice() };
          if (!(e2.length === n2 || t3.length - i2 > e2.length - n2)) {
            for (var o2, u2, l2 = t3[i2], s2 = e2.indexOf(l2, n2); s2 > -1; ) {
              if (r2.push(s2), u2 = this.traverse(e2, t3, s2 + 1, i2 + 1, r2), r2.pop(), !u2)
                return o2;
              (!o2 || o2.score < u2.score) && (o2 = u2), s2 = e2.indexOf(l2, s2 + 1);
            }
            return o2;
          }
        } }, { key: "calculateScore", value: function(e2) {
          var t3 = 0, n2 = 1;
          return e2.forEach(function(i2, r2) {
            r2 > 0 && (e2[r2 - 1] + 1 === i2 ? n2 += n2 + 1 : n2 = 1), t3 += n2;
          }), t3;
        } }, { key: "render", value: function(e2, t3, n2, i2) {
          var r2 = e2.substring(0, t3[0]);
          return t3.forEach(function(o2, u2) {
            r2 += n2 + e2[o2] + i2 + e2.substring(o2 + 1, t3[u2 + 1] ? t3[u2 + 1] : e2.length);
          }), r2;
        } }, { key: "filter", value: function(e2, t3, n2) {
          var i2 = this;
          return n2 = n2 || {}, t3.reduce(function(t4, r2, o2, u2) {
            var l2 = r2;
            n2.extract && ((l2 = n2.extract(r2)) || (l2 = ""));
            var s2 = i2.match(e2, l2, n2);
            return null != s2 && (t4[t4.length] = { string: s2.rendered, score: s2.score, index: o2, original: r2 }), t4;
          }, []).sort(function(e3, t4) {
            var n3 = t4.score - e3.score;
            return n3 || e3.index - t4.index;
          });
        } }]), t2;
      }();
      return function() {
        function t2(n2) {
          var i2, r2 = this, a = n2.values, c = void 0 === a ? null : a, h = n2.iframe, d = void 0 === h ? null : h, f = n2.selectClass, m = void 0 === f ? "highlight" : f, p = n2.containerClass, v = void 0 === p ? "tribute-container" : p, g = n2.itemClass, b = void 0 === g ? "" : g, y = n2.trigger, w = void 0 === y ? "@" : y, T = n2.autocompleteMode, C = void 0 !== T && T, S = n2.selectTemplate, E = void 0 === S ? null : S, k = n2.menuItemTemplate, x = void 0 === k ? null : k, M = n2.lookup, A = void 0 === M ? "key" : M, L = n2.fillAttr, I = void 0 === L ? "value" : L, N = n2.collection, O = void 0 === N ? null : N, D = n2.menuContainer, P = void 0 === D ? null : D, R = n2.noMatchTemplate, W = void 0 === R ? null : R, H = n2.requireLeadingSpace, B = void 0 === H || H, F = n2.allowSpaces, _ = void 0 !== F && F, j = n2.replaceTextSuffix, Y = void 0 === j ? null : j, z = n2.positionMenu, K = void 0 === z || z, q = n2.spaceSelectsMatch, U = void 0 !== q && q, X = n2.searchOpts, Q = void 0 === X ? {} : X, V = n2.menuItemLimit, G = void 0 === V ? null : V, J = n2.menuShowMinLength, Z = void 0 === J ? 0 : J;
          if (e(this, t2), this.autocompleteMode = C, this.menuSelected = 0, this.current = {}, this.inputEvent = false, this.isActive = false, this.menuContainer = P, this.allowSpaces = _, this.replaceTextSuffix = Y, this.positionMenu = K, this.hasTrailingSpace = false, this.spaceSelectsMatch = U, this.autocompleteMode && (w = "", _ = false), c)
            this.collection = [{ trigger: w, iframe: d, selectClass: m, containerClass: v, itemClass: b, selectTemplate: (E || t2.defaultSelectTemplate).bind(this), menuItemTemplate: (x || t2.defaultMenuItemTemplate).bind(this), noMatchTemplate: (i2 = W, "string" == typeof i2 ? "" === i2.trim() ? null : i2 : "function" == typeof i2 ? i2.bind(r2) : W || function() {
              return "<li>No Match Found!</li>";
            }.bind(r2)), lookup: A, fillAttr: I, values: c, requireLeadingSpace: B, searchOpts: Q, menuItemLimit: G, menuShowMinLength: Z }];
          else {
            if (!O)
              throw new Error("[Tribute] No collection specified.");
            this.autocompleteMode && console.warn("Tribute in autocomplete mode does not work for collections"), this.collection = O.map(function(e2) {
              return { trigger: e2.trigger || w, iframe: e2.iframe || d, selectClass: e2.selectClass || m, containerClass: e2.containerClass || v, itemClass: e2.itemClass || b, selectTemplate: (e2.selectTemplate || t2.defaultSelectTemplate).bind(r2), menuItemTemplate: (e2.menuItemTemplate || t2.defaultMenuItemTemplate).bind(r2), noMatchTemplate: function(e3) {
                return "string" == typeof e3 ? "" === e3.trim() ? null : e3 : "function" == typeof e3 ? e3.bind(r2) : W || function() {
                  return "<li>No Match Found!</li>";
                }.bind(r2);
              }(W), lookup: e2.lookup || A, fillAttr: e2.fillAttr || I, values: e2.values, requireLeadingSpace: e2.requireLeadingSpace, searchOpts: e2.searchOpts || Q, menuItemLimit: e2.menuItemLimit || G, menuShowMinLength: e2.menuShowMinLength || Z };
            });
          }
          new l(this), new o(this), new u(this), new s(this);
        }
        return n(t2, [{ key: "triggers", value: function() {
          return this.collection.map(function(e2) {
            return e2.trigger;
          });
        } }, { key: "attach", value: function(e2) {
          if (!e2)
            throw new Error("[Tribute] Must pass in a DOM node or NodeList.");
          if ("undefined" != typeof jQuery && e2 instanceof jQuery && (e2 = e2.get()), e2.constructor === NodeList || e2.constructor === HTMLCollection || e2.constructor === Array)
            for (var t3 = e2.length, n2 = 0; n2 < t3; ++n2)
              this._attach(e2[n2]);
          else
            this._attach(e2);
        } }, { key: "_attach", value: function(e2) {
          e2.hasAttribute("data-tribute") && console.warn("Tribute was already bound to " + e2.nodeName), this.ensureEditable(e2), this.events.bind(e2), e2.setAttribute("data-tribute", true);
        } }, { key: "ensureEditable", value: function(e2) {
          if (-1 === t2.inputTypes().indexOf(e2.nodeName)) {
            if (!e2.contentEditable)
              throw new Error("[Tribute] Cannot bind to " + e2.nodeName);
            e2.contentEditable = true;
          }
        } }, { key: "createMenu", value: function(e2) {
          var t3 = this.range.getDocument().createElement("div"), n2 = this.range.getDocument().createElement("ul");
          return t3.className = e2, t3.appendChild(n2), this.menuContainer ? this.menuContainer.appendChild(t3) : this.range.getDocument().body.appendChild(t3);
        } }, { key: "showMenuFor", value: function(e2, t3) {
          var n2 = this;
          if (!this.isActive || this.current.element !== e2 || this.current.mentionText !== this.currentMentionTextSnapshot) {
            this.currentMentionTextSnapshot = this.current.mentionText, this.menu || (this.menu = this.createMenu(this.current.collection.containerClass), e2.tributeMenu = this.menu, this.menuEvents.bind(this.menu)), this.isActive = true, this.menuSelected = 0, this.current.mentionText || (this.current.mentionText = "");
            var r2 = function(e3) {
              if (n2.isActive) {
                var r3 = n2.search.filter(n2.current.mentionText, e3, { pre: n2.current.collection.searchOpts.pre || "<span>", post: n2.current.collection.searchOpts.post || "</span>", skip: n2.current.collection.searchOpts.skip, extract: function(e4) {
                  if ("string" == typeof n2.current.collection.lookup)
                    return e4[n2.current.collection.lookup];
                  if ("function" == typeof n2.current.collection.lookup)
                    return n2.current.collection.lookup(e4, n2.current.mentionText);
                  throw new Error("Invalid lookup attribute, lookup must be string or function.");
                } });
                n2.current.collection.menuItemLimit && (r3 = r3.slice(0, n2.current.collection.menuItemLimit)), n2.current.filteredItems = r3;
                var o2 = n2.menu.querySelector("ul");
                if (n2.range.positionMenuAtCaret(t3), !r3.length) {
                  var u2 = new CustomEvent("tribute-no-match", { detail: n2.menu });
                  return n2.current.element.dispatchEvent(u2), void ("function" == typeof n2.current.collection.noMatchTemplate && !n2.current.collection.noMatchTemplate() || !n2.current.collection.noMatchTemplate ? n2.hideMenu() : "function" == typeof n2.current.collection.noMatchTemplate ? o2.innerHTML = n2.current.collection.noMatchTemplate() : o2.innerHTML = n2.current.collection.noMatchTemplate);
                }
                o2.innerHTML = "";
                var l2 = n2.range.getDocument().createDocumentFragment();
                r3.forEach(function(e4, t4) {
                  var r4 = n2.range.getDocument().createElement("li");
                  r4.setAttribute("data-index", t4), r4.className = n2.current.collection.itemClass, r4.addEventListener("mousemove", function(e5) {
                    var t5 = i(n2._findLiTarget(e5.target), 2), r5 = (t5[0], t5[1]);
                    0 !== e5.movementY && n2.events.setActiveLi(r5);
                  }), n2.menuSelected === t4 && r4.classList.add(n2.current.collection.selectClass), r4.innerHTML = n2.current.collection.menuItemTemplate(e4), l2.appendChild(r4);
                }), o2.appendChild(l2);
              }
            };
            "function" == typeof this.current.collection.values ? this.current.collection.values(this.current.mentionText, r2) : r2(this.current.collection.values);
          }
        } }, { key: "_findLiTarget", value: function(e2) {
          if (!e2)
            return [];
          var t3 = e2.getAttribute("data-index");
          return t3 ? [e2, t3] : this._findLiTarget(e2.parentNode);
        } }, { key: "showMenuForCollection", value: function(e2, t3) {
          e2 !== document.activeElement && this.placeCaretAtEnd(e2), this.current.collection = this.collection[t3 || 0], this.current.externalTrigger = true, this.current.element = e2, e2.isContentEditable ? this.insertTextAtCursor(this.current.collection.trigger) : this.insertAtCaret(e2, this.current.collection.trigger), this.showMenuFor(e2);
        } }, { key: "placeCaretAtEnd", value: function(e2) {
          if (e2.focus(), void 0 !== window.getSelection && void 0 !== document.createRange) {
            var t3 = document.createRange();
            t3.selectNodeContents(e2), t3.collapse(false);
            var n2 = window.getSelection();
            n2.removeAllRanges(), n2.addRange(t3);
          } else if (void 0 !== document.body.createTextRange) {
            var i2 = document.body.createTextRange();
            i2.moveToElementText(e2), i2.collapse(false), i2.select();
          }
        } }, { key: "insertTextAtCursor", value: function(e2) {
          var t3, n2;
          (n2 = (t3 = window.getSelection()).getRangeAt(0)).deleteContents();
          var i2 = document.createTextNode(e2);
          n2.insertNode(i2), n2.selectNodeContents(i2), n2.collapse(false), t3.removeAllRanges(), t3.addRange(n2);
        } }, { key: "insertAtCaret", value: function(e2, t3) {
          var n2 = e2.scrollTop, i2 = e2.selectionStart, r2 = e2.value.substring(0, i2), o2 = e2.value.substring(e2.selectionEnd, e2.value.length);
          e2.value = r2 + t3 + o2, i2 += t3.length, e2.selectionStart = i2, e2.selectionEnd = i2, e2.focus(), e2.scrollTop = n2;
        } }, { key: "hideMenu", value: function() {
          this.menu && (this.menu.style.cssText = "display: none;", this.isActive = false, this.menuSelected = 0, this.current = {});
        } }, { key: "selectItemAtIndex", value: function(e2, t3) {
          if ("number" == typeof (e2 = parseInt(e2)) && !isNaN(e2)) {
            var n2 = this.current.filteredItems[e2], i2 = this.current.collection.selectTemplate(n2);
            null !== i2 && this.replaceText(i2, t3, n2);
          }
        } }, { key: "replaceText", value: function(e2, t3, n2) {
          this.range.replaceTriggerText(e2, true, true, t3, n2);
        } }, { key: "_append", value: function(e2, t3, n2) {
          if ("function" == typeof e2.values)
            throw new Error("Unable to append to values, as it is a function.");
          e2.values = n2 ? t3 : e2.values.concat(t3);
        } }, { key: "append", value: function(e2, t3, n2) {
          var i2 = parseInt(e2);
          if ("number" != typeof i2)
            throw new Error("please provide an index for the collection to update.");
          var r2 = this.collection[i2];
          this._append(r2, t3, n2);
        } }, { key: "appendCurrent", value: function(e2, t3) {
          if (!this.isActive)
            throw new Error("No active state. Please use append instead and pass an index.");
          this._append(this.current.collection, e2, t3);
        } }, { key: "detach", value: function(e2) {
          if (!e2)
            throw new Error("[Tribute] Must pass in a DOM node or NodeList.");
          if ("undefined" != typeof jQuery && e2 instanceof jQuery && (e2 = e2.get()), e2.constructor === NodeList || e2.constructor === HTMLCollection || e2.constructor === Array)
            for (var t3 = e2.length, n2 = 0; n2 < t3; ++n2)
              this._detach(e2[n2]);
          else
            this._detach(e2);
        } }, { key: "_detach", value: function(e2) {
          var t3 = this;
          this.events.unbind(e2), e2.tributeMenu && this.menuEvents.unbind(e2.tributeMenu), setTimeout(function() {
            e2.removeAttribute("data-tribute"), t3.isActive = false, e2.tributeMenu && e2.tributeMenu.remove();
          });
        } }, { key: "isActive", get: function() {
          return this._isActive;
        }, set: function(e2) {
          if (this._isActive != e2 && (this._isActive = e2, this.current.element)) {
            var t3 = new CustomEvent("tribute-active-".concat(e2));
            this.current.element.dispatchEvent(t3);
          }
        } }], [{ key: "defaultSelectTemplate", value: function(e2) {
          return void 0 === e2 ? "".concat(this.current.collection.trigger).concat(this.current.mentionText) : this.range.isContentEditable(this.current.element) ? '<span class="tribute-mention">' + (this.current.collection.trigger + e2.original[this.current.collection.fillAttr]) + "</span>" : this.current.collection.trigger + e2.original[this.current.collection.fillAttr];
        } }, { key: "defaultMenuItemTemplate", value: function(e2) {
          return e2.string;
        } }, { key: "inputTypes", value: function() {
          return ["TEXTAREA", "INPUT"];
        } }]), t2;
      }();
    });
  }
});

// src/app/pdf/components/facts/fact-note/fact-note.component.ts
var import_tributejs = __toESM(require_tribute_min());
var _c0 = ["editableDiv"];
var _c1 = (a0, a1, a2, a3) => ({ "shadow-[0px_0px_8px_#0063ffde]": a0, "border rounded-base ps-2.5 pe-1.5 bg-white": a1, "!shadow-none bg-transparent p-0": a2, "min-h-28": a3 });
var _c2 = (a0) => ({ "bg-white": a0 });
function FactNoteComponent_h6_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "h6", 7)(1, "mat-checkbox", 8);
    \u0275\u0275twoWayListener("ngModelChange", function FactNoteComponent_h6_1_Template_mat_checkbox_ngModelChange_1_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r2.bIsHighlighted, $event) || (ctx_r2.bIsHighlighted = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("change", function FactNoteComponent_h6_1_Template_mat_checkbox_change_1_listener($event) {
      \u0275\u0275restoreView(_r2);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.pushhilight($event));
    });
    \u0275\u0275text(2);
    \u0275\u0275pipe(3, "translate");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275twoWayProperty("ngModel", ctx_r2.bIsHighlighted);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind1(3, 2, "FACTS.NOTE.USE_HIGHLIGHTED"));
  }
}
function FactNoteComponent_ng_template_3_ng_container_1_ng_container_1_hr_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "hr", 15);
  }
}
function FactNoteComponent_ng_template_3_ng_container_1_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275element(1, "div", 14);
    \u0275\u0275template(2, FactNoteComponent_ng_template_3_ng_container_1_ng_container_1_hr_2_Template, 1, 0, "hr", 11);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const x_r4 = ctx.$implicit;
    const i_r5 = ctx.index;
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275advance();
    \u0275\u0275property("innerHTML", x_r4, \u0275\u0275sanitizeHtml);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", i_r5 != ctx_r2.jOTexts.length - 1);
  }
}
function FactNoteComponent_ng_template_3_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275template(1, FactNoteComponent_ng_template_3_ng_container_1_ng_container_1_Template, 3, 2, "ng-container", 13);
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", ctx_r2.jOTexts);
  }
}
function FactNoteComponent_ng_template_3_hr_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "hr", 15);
  }
}
function FactNoteComponent_ng_template_3_pre_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "pre", 16, 2);
    \u0275\u0275listener("focus", function FactNoteComponent_ng_template_3_pre_3_Template_pre_focus_0_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.isFocus = true);
    })("blur", function FactNoteComponent_ng_template_3_pre_3_Template_pre_blur_0_listener() {
      \u0275\u0275restoreView(_r6);
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.isFocus = false);
    })("input", function FactNoteComponent_ng_template_3_pre_3_Template_pre_input_0_listener($event) {
      const i_r7 = \u0275\u0275restoreView(_r6).index;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.updateJText($event, i_r7));
    })("keyup.backspace", function FactNoteComponent_ng_template_3_pre_3_Template_pre_keyup_backspace_0_listener($event) {
      const i_r7 = \u0275\u0275restoreView(_r6).index;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.OnBackSpaceKeyUp($event, i_r7));
    });
    \u0275\u0275text(2, "      ");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const x_r8 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275property("ngClass", \u0275\u0275pureFunction1(3, _c2, ctx_r2.isnotHeader))("innerHTML", x_r8, \u0275\u0275sanitizeHtml);
    \u0275\u0275attribute("data-placeholder", ctx_r2.getPlaceholderText());
  }
}
function FactNoteComponent_ng_template_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 9);
    \u0275\u0275template(1, FactNoteComponent_ng_template_3_ng_container_1_Template, 2, 1, "ng-container", 10)(2, FactNoteComponent_ng_template_3_hr_2_Template, 1, 0, "hr", 11)(3, FactNoteComponent_ng_template_3_pre_3_Template, 3, 5, "pre", 12);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r2.bIsHighlighted);
    \u0275\u0275advance();
    \u0275\u0275property("ngIf", ctx_r2.bIsHighlighted && (ctx_r2.jOTexts == null ? null : ctx_r2.jOTexts.length));
    \u0275\u0275advance();
    \u0275\u0275property("ngForOf", ctx_r2.jEditedTexts);
  }
}
function FactNoteComponent_ng_container_5_ng_container_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainer(0);
  }
}
function FactNoteComponent_ng_container_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainerStart(0);
    \u0275\u0275elementStart(1, "ng-scrollbar", 17);
    \u0275\u0275template(2, FactNoteComponent_ng_container_5_ng_container_2_Template, 1, 0, "ng-container", 18);
    \u0275\u0275elementEnd();
    \u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    \u0275\u0275nextContext();
    const noteBody_r9 = \u0275\u0275reference(4);
    \u0275\u0275advance();
    \u0275\u0275property("orientation", "vertical")("visibility", "visible")("appearance", "native");
    \u0275\u0275advance();
    \u0275\u0275property("ngTemplateOutlet", noteBody_r9);
  }
}
function FactNoteComponent_ng_template_6_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementContainer(0);
  }
}
function FactNoteComponent_ng_template_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 19);
    \u0275\u0275template(1, FactNoteComponent_ng_template_6_ng_container_1_Template, 1, 0, "ng-container", 18);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275nextContext();
    const noteBody_r9 = \u0275\u0275reference(4);
    \u0275\u0275advance();
    \u0275\u0275property("ngTemplateOutlet", noteBody_r9);
  }
}
function FactNoteComponent_span_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 20);
    \u0275\u0275text(1);
    \u0275\u0275pipe(2, "translate");
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", \u0275\u0275pipeBind1(2, 1, "FACTS.NOTE.SEARCH_HINT"), " ");
  }
}
var FactNoteComponent = class _FactNoteComponent {
  constructor(contactService, cdr, cf, translate) {
    this.contactService = contactService;
    this.cdr = cdr;
    this.cf = cf;
    this.translate = translate;
    this.imgPath = `${environment.documentStorage}${environment.userProfilePath}`;
    this.jEditedTexts = [""];
    this.type = "F";
    this.linkType = "F";
    this.isAddNote = false;
    this.isnotHeader = true;
    this.jOTexts = [];
    this.jTexts = [];
    this.bIsHighlighted = false;
    this.jTextsChange = new EventEmitter();
    this.bIsHighlightedChange = new EventEmitter();
    this.updatejtext = new EventEmitter();
    this.isEmptyChange = new EventEmitter();
    this.isFocus = false;
    this.isNoteEdited = false;
    this.isNoteEditedChange = new EventEmitter();
    this.onEvent = new EventEmitter();
  }
  ngOnChanges(changes) {
    if (changes["jEditedTexts"] && !changes["jEditedTexts"].firstChange) {
      this.cdr.detectChanges();
    }
    if (changes["jTexts"] && !changes["jTexts"].firstChange) {
      this.ngOnInit();
    }
  }
  ngAfterViewInit() {
    this.focusLastDiv();
    this.setupPlaceholders();
    queueMicrotask(() => {
      if (this.sb && typeof this.sb.update === "function") {
        this.sb.update();
      }
    });
  }
  ngOnInit() {
    return __async(this, null, function* () {
      if (this.type == "QF" && this.isAddNote) {
        this.isNoteEdited = false;
        this.isNoteEditedChange.emit(this.isNoteEdited);
      }
      if (!this.jTexts || !this.jTexts.length) {
        this.jEditedTexts = [""];
      } else {
        this.jEditedTexts = [...this.jTexts];
      }
      const addContact = (item) => {
        this.onEvent.emit({ event: "ADD-CONTECT", data: item });
      };
      const selectedContacts = yield this.contactService.getContactList(this.nCaseid);
      this.tribute = new import_tributejs.default({
        values: selectedContacts,
        lookup: (contact) => {
          return `${contact?.cFname || ""} ${contact?.cLname || ""} ${contact?.cMentiontag || ""}`;
        },
        selectTemplate: function(item) {
          addContact(item);
          return `<a class='font-bold' id="${item.original.nContactid}">@${item.original.cFname} ${item.original.cLname}</a>`;
        },
        menuItemTemplate: (item) => {
          const avatar = this.genrateavatar(item.original);
          return `<div
            class="flex items-start gap-2  px-5 py-2.5 rounded-base mb-2 cursor-pointer">
            ${avatar}
            <div class="gap-1 flex flex-col">
              <span class="text-xs font-semibold">${item?.original?.cFname || ""} ${item?.original?.cLname || ""}
              </span>
              <span class="underline text-xxs leading-none truncate">${item?.original?.cMentiontag || ""}</span>
            </div>
          </div>`;
        }
      });
      this.attachTribute();
    });
  }
  genrateavatar(detail) {
    let initials = this.cf.get_userinit2(detail);
    const firstName = initials.Fn;
    const lastName = initials.Ln;
    const bgColor = initials.bg;
    const path = this.imgPath + "contacts/" + detail?.cProfile;
    if (detail?.cProfile) {
      return `
    <span  
    class="inline-flex overflow-hidden size- items-center justify-center  rounded-full font-semibold text-white leading-none  border border-[#DAE2EA] size-[35px] text-[9px]">
    <ng-container *ngIf="detail?.cProfile">
    <img class="object-cover w-full h-full" src="${path}" (error)="assets/colorlogo.svg" >
    </ng-container>
    </span>`;
    } else {
      return `
      <span 
      class="inline-flex overflow-hidden size- items-center justify-center ${bgColor}  rounded-full font-semibold text-white leading-none  border border-[#DAE2EA] size-[35px] text-[9px]">
        <ng-container *ngIf="!detail?.cProfile">
                <span>${firstName} ${lastName}</span>
        </ng-container>
      </span>`;
    }
  }
  focusLastDiv() {
    const lastDiv = this.editableDivs.last;
    if (lastDiv) {
      const element = lastDiv.nativeElement;
      element.focus();
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(element);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }
  onContainerClick(event) {
    const target = event.target;
    if (!target.isContentEditable && !target.closest('[contenteditable="true"]')) {
      this.focusLastDiv();
    }
  }
  attachTribute() {
    if (this.editableDivs) {
      this.editableDivs.forEach((editableDiv) => {
        this.tribute.attach(editableDiv.nativeElement);
        this.updatePlaceholder(editableDiv.nativeElement);
      });
    }
  }
  updateJText(event, index) {
    const target = event.target;
    this.checkForIsNoteEdited(event, index);
    if (!this.jTexts[index]) {
      this.jTexts[index] = "";
    }
    this.jTexts[index] = target.innerHTML;
    this.jTextsChange.emit(this.jTexts);
    this.updatejtext.emit(this.jTexts);
    this.updatePlaceholder(target);
    this.isEmpty = false;
    if (!target.innerText || target.innerText.trim() == "") {
      this.isEmpty = true;
    }
    this.isEmptyChange.emit(this.isEmpty);
    this.cdr.detectChanges();
  }
  OnBackSpaceKeyUp(e, index) {
    const plainText = e.target.textContent || "";
    if (plainText == "") {
      const isNotLast = !(this.jEditedTexts?.length == 1);
      if (isNotLast) {
        if (this.jTexts?.length > index) {
          this.jTexts.splice(index, 1);
          this.jTextsChange.emit(this.jTexts);
        }
        if (this.jEditedTexts?.length > index) {
          this.jEditedTexts.splice(index, 1);
        }
        this.cdr.detectChanges();
        this.focusLastDiv();
        this.cdr.detectChanges();
      }
    }
  }
  checkForIsNoteEdited(e, index) {
    try {
      if (this.type == "QF") {
        if (index == this.jEditedTexts.length - 1) {
          this.isNoteEdited = true;
          this.isNoteEditedChange.emit(this.isNoteEdited);
        }
      }
    } catch (error) {
    }
  }
  pushhilight(ev) {
    this.bIsHighlightedChange.emit(this.bIsHighlighted);
    setTimeout(() => {
      this.focusLastDiv();
      this.setupPlaceholders();
    }, 100);
    if (this.jEditedTexts.length < 0 && this.jEditedTexts[0] == "") {
      this.jEditedTexts[0] = "Note : <br><br>";
    }
  }
  getPlaceholderText() {
    if (this.type === "QF") {
      return this.translate.instant("FACTS.NOTE.PLACEHOLDER.ADD_NOTE");
    } else if (this.type === "F") {
      return this.translate.instant("FACTS.NOTE.PLACEHOLDER.ADD_FACT_NOTE");
    }
    return this.translate.instant("FACTS.NOTE.PLACEHOLDER.START_TYPING");
  }
  setupPlaceholders() {
    if (this.editableDivs) {
      this.editableDivs.forEach((editableDiv) => {
        this.updatePlaceholder(editableDiv.nativeElement);
      });
    }
  }
  updatePlaceholder(element) {
    const hasContent = element.textContent && element.textContent.trim() !== "";
    if (!hasContent) {
      element.setAttribute("data-placeholder", this.getPlaceholderText());
      element.classList.add("show-placeholder");
    } else {
      element.classList.remove("show-placeholder");
    }
  }
  static {
    this.\u0275fac = function FactNoteComponent_Factory(t) {
      return new (t || _FactNoteComponent)(\u0275\u0275directiveInject(ContactService), \u0275\u0275directiveInject(ChangeDetectorRef), \u0275\u0275directiveInject(CommonfunctionService), \u0275\u0275directiveInject(TranslateService));
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _FactNoteComponent, selectors: [["fact-note"]], viewQuery: function FactNoteComponent_Query(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275viewQuery(NgScrollbar, 5);
        \u0275\u0275viewQuery(_c0, 5);
      }
      if (rf & 2) {
        let _t;
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.sb = _t.first);
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.editableDivs = _t);
      }
    }, inputs: { type: "type", linkType: "linkType", isAddNote: "isAddNote", isnotHeader: "isnotHeader", nCaseid: "nCaseid", jOTexts: "jOTexts", jTexts: "jTexts", bIsHighlighted: "bIsHighlighted", isEmpty: "isEmpty", isNoteEdited: "isNoteEdited" }, outputs: { jTextsChange: "jTextsChange", bIsHighlightedChange: "bIsHighlightedChange", updatejtext: "updatejtext", isEmptyChange: "isEmptyChange", isNoteEditedChange: "isNoteEditedChange", onEvent: "onEvent" }, standalone: true, features: [\u0275\u0275NgOnChangesFeature, \u0275\u0275StandaloneFeature], decls: 9, vars: 10, consts: [["noteBody", ""], ["tableNoteScroll", ""], ["editableDiv", ""], ["class", "text-xs text-start font-semibold mb-2 focus-visible:outline-none focus-visible:border-gray-400", "for", "factBox", 4, "ngIf"], [1, "bg-white", "p-1.5", "rounded-base", 3, "click", "ngClass"], [4, "ngIf", "ngIfElse"], ["class", "text-xxs text-blue-on mt-3", 4, "ngIf"], ["for", "factBox", 1, "text-xs", "text-start", "font-semibold", "mb-2", "focus-visible:outline-none", "focus-visible:border-gray-400"], [3, "ngModelChange", "change", "ngModel"], [1, "text-xs", "h-full"], [4, "ngIf"], ["class", "mt-2 mb-2 border-tab", 4, "ngIf"], ["contenteditable", "true", "class", " text-xs note-text m-0 focus-visible:!border-none focus-visible:!outline-none focus:!border-none focus:!outline-none parent whitespace-pre-wrap", 3, "ngClass", "innerHTML", "focus", "blur", "input", "keyup.backspace", 4, "ngFor", "ngForOf"], [4, "ngFor", "ngForOf"], ["contenteditable", "false", "aria-readonly", "true", 1, "text-xs", "opacity-70", "pt-2.5", "focus-visible:!border-none", "focus-visible:!outline-none", "focus:!border-none", "focus:!outline-none", "parent", 3, "innerHTML"], [1, "mt-2", "mb-2", "border-tab"], ["contenteditable", "true", 1, "text-xs", "note-text", "m-0", "focus-visible:!border-none", "focus-visible:!outline-none", "focus:!border-none", "focus:!outline-none", "parent", "whitespace-pre-wrap", 3, "focus", "blur", "input", "keyup.backspace", "ngClass", "innerHTML"], [1, "thinthumb", 2, "max-height", "112px", "min-height", "112px", "--scrollbar-track-color", "white", "--scrollbar-thickness", "11", 3, "orientation", "visibility", "appearance"], [4, "ngTemplateOutlet"], [1, "w-full", "h-full"], [1, "text-xxs", "text-blue-on", "mt-3"]], template: function FactNoteComponent_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = \u0275\u0275getCurrentView();
        \u0275\u0275elementStart(0, "div");
        \u0275\u0275template(1, FactNoteComponent_h6_1_Template, 4, 4, "h6", 3);
        \u0275\u0275elementStart(2, "div", 4);
        \u0275\u0275listener("click", function FactNoteComponent_Template_div_click_2_listener($event) {
          \u0275\u0275restoreView(_r1);
          return \u0275\u0275resetView(ctx.onContainerClick($event));
        });
        \u0275\u0275template(3, FactNoteComponent_ng_template_3_Template, 4, 3, "ng-template", null, 0, \u0275\u0275templateRefExtractor)(5, FactNoteComponent_ng_container_5_Template, 3, 4, "ng-container", 5)(6, FactNoteComponent_ng_template_6_Template, 2, 1, "ng-template", null, 1, \u0275\u0275templateRefExtractor);
        \u0275\u0275elementEnd();
        \u0275\u0275template(8, FactNoteComponent_span_8_Template, 3, 3, "span", 6);
        \u0275\u0275elementEnd();
      }
      if (rf & 2) {
        const tableNoteScroll_r10 = \u0275\u0275reference(7);
        \u0275\u0275advance();
        \u0275\u0275property("ngIf", (ctx.type == "F" || ctx.type == "QF") && ctx.linkType == "H");
        \u0275\u0275advance();
        \u0275\u0275property("ngClass", \u0275\u0275pureFunction4(5, _c1, ctx.isFocus, ctx.isnotHeader, !ctx.isnotHeader, ctx.type == "QF"));
        \u0275\u0275advance(3);
        \u0275\u0275property("ngIf", ctx.isnotHeader)("ngIfElse", tableNoteScroll_r10);
        \u0275\u0275advance(3);
        \u0275\u0275property("ngIf", ctx.isnotHeader && ctx.type == "F");
      }
    }, dependencies: [CommonModule, NgClass, NgForOf, NgIf, NgTemplateOutlet, MatCheckboxModule, MatCheckbox, FormsModule, NgControlStatus, NgModel, NgScrollbarModule, NgScrollbar, TranslateModule, TranslatePipe], styles: ["\n\n.parent[_ngcontent-%COMP%]:has(.noteditable)    + .parent[_ngcontent-%COMP%] {\n  -webkit-user-select: none;\n  user-select: none;\n  pointer-events: none;\n  opacity: 0.5;\n}\n.parent[_ngcontent-%COMP%]:has(.noteditable) {\n  display: none;\n}\n.parent[_ngcontent-%COMP%]:has(.editable) {\n  display: none;\n}\n.parent[_ngcontent-%COMP%]:has(.editable)    + .parent[_ngcontent-%COMP%] {\n  -webkit-user-select: all;\n  user-select: all;\n  pointer-events: all;\n}\n[contenteditable=true].show-placeholder[_ngcontent-%COMP%] {\n  position: relative;\n}\n[contenteditable=true].show-placeholder[_ngcontent-%COMP%]:before {\n  content: attr(data-placeholder);\n  color: #aeaeae;\n  pointer-events: none;\n  position: absolute;\n  top: 12;\n  left: 0;\n  z-index: 1;\n}\n[contenteditable=true].show-placeholder[_ngcontent-%COMP%]:focus:before {\n  color: #6b7280;\n}\n.note-text[_ngcontent-%COMP%] {\n  display: block;\n  width: 100%;\n  text-align: justify;\n  text-justify: inter-word;\n}\n/*# sourceMappingURL=fact-note.component.css.map */"], changeDetection: 0 });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(FactNoteComponent, { className: "FactNoteComponent", filePath: "src\\app\\pdf\\components\\facts\\fact-note\\fact-note.component.ts", lineNumber: 21 });
})();

export {
  FactNoteComponent
};
//# sourceMappingURL=chunk-BPYJFBIA.js.map
