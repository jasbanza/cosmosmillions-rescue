(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.module = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],2:[function(require,module,exports){
/*
 *  big.js v7.0.0
 *  A small, fast, easy-to-use library for arbitrary-precision decimal arithmetic.
 *  Copyright (c) 2025 Michael Mclaughlin
 *  https://github.com/MikeMcl/big.js/LICENCE.md
 */
;(function (GLOBAL) {
  'use strict';
  var Big,


/************************************** EDITABLE DEFAULTS *****************************************/


    // The default values below must be integers within the stated ranges.

    /*
     * The maximum number of decimal places (DP) of the results of operations involving division:
     * div and sqrt, and pow with negative exponents.
     */
    DP = 20,            // 0 to MAX_DP

    /*
     * The rounding mode (RM) used when rounding to the above decimal places.
     *
     *  0  Towards zero (i.e. truncate, no rounding).       (ROUND_DOWN)
     *  1  To nearest neighbour. If equidistant, round up.  (ROUND_HALF_UP)
     *  2  To nearest neighbour. If equidistant, to even.   (ROUND_HALF_EVEN)
     *  3  Away from zero.                                  (ROUND_UP)
     */
    RM = 1,             // 0, 1, 2 or 3

    // The maximum value of DP and Big.DP.
    MAX_DP = 1E6,       // 0 to 1000000

    // The maximum magnitude of the exponent argument to the pow method.
    MAX_POWER = 1E6,    // 1 to 1000000

    /*
     * The negative exponent (NE) at and beneath which toString returns exponential notation.
     * (JavaScript numbers: -7)
     * -1000000 is the minimum recommended exponent value of a Big.
     */
    NE = -7,            // 0 to -1000000

    /*
     * The positive exponent (PE) at and above which toString returns exponential notation.
     * (JavaScript numbers: 21)
     * 1000000 is the maximum recommended exponent value of a Big, but this limit is not enforced.
     */
    PE = 21,            // 0 to 1000000

    /*
     * When true, an error will be thrown if a primitive number is passed to the Big constructor,
     * or if valueOf is called, or if toNumber is called on a Big which cannot be converted to a
     * primitive number without a loss of precision.
     */
    STRICT = false,     // true or false


/**************************************************************************************************/


    // Error messages.
    NAME = '[big.js] ',
    INVALID = NAME + 'Invalid ',
    INVALID_DP = INVALID + 'decimal places',
    INVALID_RM = INVALID + 'rounding mode',
    DIV_BY_ZERO = NAME + 'Division by zero',

    // The shared prototype object.
    P = {},
    UNDEFINED = void 0,
    NUMERIC = /^-?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i;


  /*
   * Create and return a Big constructor.
   */
  function _Big_() {

    /*
     * The Big constructor and exported function.
     * Create and return a new instance of a Big number object.
     *
     * n {number|string|Big} A numeric value.
     */
    function Big(n) {
      var x = this;

      // Enable constructor usage without new.
      if (!(x instanceof Big)) {
        return n === UNDEFINED && arguments.length === 0 ? _Big_() : new Big(n);
      }

      // Duplicate.
      if (n instanceof Big) {
        x.s = n.s;
        x.e = n.e;
        x.c = n.c.slice();
      } else {
        if (typeof n !== 'string') {
          if (Big.strict === true && typeof n !== 'bigint') {
            throw TypeError(INVALID + 'value');
          }

          // Minus zero?
          n = n === 0 && 1 / n < 0 ? '-0' : String(n);
        }

        parse(x, n);
      }

      // Retain a reference to this Big constructor.
      // Shadow Big.prototype.constructor which points to Object.
      x.constructor = Big;
    }

    Big.prototype = P;
    Big.DP = DP;
    Big.RM = RM;
    Big.NE = NE;
    Big.PE = PE;
    Big.strict = STRICT;
    Big.roundDown = 0;
    Big.roundHalfUp = 1;
    Big.roundHalfEven = 2;
    Big.roundUp = 3;

    return Big;
  }


  /*
   * Parse the number or string value passed to a Big constructor.
   *
   * x {Big} A Big number instance.
   * n {number|string} A numeric value.
   */
  function parse(x, n) {
    var e, i, nl;

    if (!NUMERIC.test(n)) {
      throw Error(INVALID + 'number');
    }

    // Determine sign.
    x.s = n.charAt(0) == '-' ? (n = n.slice(1), -1) : 1;

    // Decimal point?
    if ((e = n.indexOf('.')) > -1) n = n.replace('.', '');

    // Exponential form?
    if ((i = n.search(/e/i)) > 0) {

      // Determine exponent.
      if (e < 0) e = i;
      e += +n.slice(i + 1);
      n = n.substring(0, i);
    } else if (e < 0) {

      // Integer.
      e = n.length;
    }

    nl = n.length;

    // Determine leading zeros.
    for (i = 0; i < nl && n.charAt(i) == '0';) ++i;

    if (i == nl) {

      // Zero.
      x.c = [x.e = 0];
    } else {

      // Determine trailing zeros.
      for (; nl > 0 && n.charAt(--nl) == '0';);
      x.e = e - i - 1;
      x.c = [];

      // Convert string to array of digits without leading/trailing zeros.
      for (e = 0; i <= nl;) x.c[e++] = +n.charAt(i++);
    }

    return x;
  }


  /*
   * Round Big x to a maximum of sd significant digits using rounding mode rm.
   *
   * x {Big} The Big to round.
   * sd {number} Significant digits: integer, 0 to MAX_DP inclusive.
   * rm {number} Rounding mode: 0 (down), 1 (half-up), 2 (half-even) or 3 (up).
   * [more] {boolean} Whether the result of division was truncated.
   */
  function round(x, sd, rm, more) {
    var xc = x.c;

    if (rm === UNDEFINED) rm = x.constructor.RM;
    if (rm !== 0 && rm !== 1 && rm !== 2 && rm !== 3) {
      throw Error(INVALID_RM);
    }

    if (sd < 1) {
      more =
        rm === 3 && (more || !!xc[0]) || sd === 0 && (
        rm === 1 && xc[0] >= 5 ||
        rm === 2 && (xc[0] > 5 || xc[0] === 5 && (more || xc[1] !== UNDEFINED))
      );

      xc.length = 1;

      if (more) {

        // 1, 0.1, 0.01, 0.001, 0.0001 etc.
        x.e = x.e - sd + 1;
        xc[0] = 1;
      } else {

        // Zero.
        xc[0] = x.e = 0;
      }
    } else if (sd < xc.length) {

      // xc[sd] is the digit after the digit that may be rounded up.
      more =
        rm === 1 && xc[sd] >= 5 ||
        rm === 2 && (xc[sd] > 5 || xc[sd] === 5 &&
          (more || xc[sd + 1] !== UNDEFINED || xc[sd - 1] & 1)) ||
        rm === 3 && (more || !!xc[0]);

      // Remove any digits after the required precision.
      xc.length = sd;

      // Round up?
      if (more) {

        // Rounding up may mean the previous digit has to be rounded up.
        for (; ++xc[--sd] > 9;) {
          xc[sd] = 0;
          if (sd === 0) {
            ++x.e;
            xc.unshift(1);
            break;
          }
        }
      }

      // Remove trailing zeros.
      for (sd = xc.length; !xc[--sd];) xc.pop();
    }

    return x;
  }


  /*
   * Return a string representing the value of Big x in normal or exponential notation.
   * Handles P.toExponential, P.toFixed, P.toJSON, P.toPrecision, P.toString and P.valueOf.
   */
  function stringify(x, doExponential, isNonzero) {
    var e = x.e,
      s = x.c.join(''),
      n = s.length;

    // Exponential notation?
    if (doExponential) {
      s = s.charAt(0) + (n > 1 ? '.' + s.slice(1) : '') + (e < 0 ? 'e' : 'e+') + e;

    // Normal notation.
    } else if (e < 0) {
      for (; ++e;) s = '0' + s;
      s = '0.' + s;
    } else if (e > 0) {
      if (++e > n) {
        for (e -= n; e--;) s += '0';
      } else if (e < n) {
        s = s.slice(0, e) + '.' + s.slice(e);
      }
    } else if (n > 1) {
      s = s.charAt(0) + '.' + s.slice(1);
    }

    return x.s < 0 && isNonzero ? '-' + s : s;
  }


  // Prototype/instance methods


  /*
   * Return a new Big whose value is the absolute value of this Big.
   */
  P.abs = function () {
    var x = new this.constructor(this);
    x.s = 1;
    return x;
  };


  /*
   * Return 1 if the value of this Big is greater than the value of Big y,
   *       -1 if the value of this Big is less than the value of Big y, or
   *        0 if they have the same value.
   */
  P.cmp = function (y) {
    var isneg,
      x = this,
      xc = x.c,
      yc = (y = new x.constructor(y)).c,
      i = x.s,
      j = y.s,
      k = x.e,
      l = y.e;

    // Either zero?
    if (!xc[0] || !yc[0]) return !xc[0] ? !yc[0] ? 0 : -j : i;

    // Signs differ?
    if (i != j) return i;

    isneg = i < 0;

    // Compare exponents.
    if (k != l) return k > l ^ isneg ? 1 : -1;

    j = (k = xc.length) < (l = yc.length) ? k : l;

    // Compare digit by digit.
    for (i = -1; ++i < j;) {
      if (xc[i] != yc[i]) return xc[i] > yc[i] ^ isneg ? 1 : -1;
    }

    // Compare lengths.
    return k == l ? 0 : k > l ^ isneg ? 1 : -1;
  };


  /*
   * Return a new Big whose value is the value of this Big divided by the value of Big y, rounded,
   * if necessary, to a maximum of Big.DP decimal places using rounding mode Big.RM.
   */
  P.div = function (y) {
    var x = this,
      Big = x.constructor,
      a = x.c,                  // dividend
      b = (y = new Big(y)).c,   // divisor
      k = x.s == y.s ? 1 : -1,
      dp = Big.DP;

    if (dp !== ~~dp || dp < 0 || dp > MAX_DP) {
      throw Error(INVALID_DP);
    }

    // Divisor is zero?
    if (!b[0]) {
      throw Error(DIV_BY_ZERO);
    }

    // Dividend is 0? Return +-0.
    if (!a[0]) {
      y.s = k;
      y.c = [y.e = 0];
      return y;
    }

    var bl, bt, n, cmp, ri,
      bz = b.slice(),
      ai = bl = b.length,
      al = a.length,
      r = a.slice(0, bl),   // remainder
      rl = r.length,
      q = y,                // quotient
      qc = q.c = [],
      qi = 0,
      p = dp + (q.e = x.e - y.e) + 1;    // precision of the result

    q.s = k;
    k = p < 0 ? 0 : p;

    // Create version of divisor with leading zero.
    bz.unshift(0);

    // Add zeros to make remainder as long as divisor.
    for (; rl++ < bl;) r.push(0);

    do {

      // n is how many times the divisor goes into current remainder.
      for (n = 0; n < 10; n++) {

        // Compare divisor and remainder.
        if (bl != (rl = r.length)) {
          cmp = bl > rl ? 1 : -1;
        } else {
          for (ri = -1, cmp = 0; ++ri < bl;) {
            if (b[ri] != r[ri]) {
              cmp = b[ri] > r[ri] ? 1 : -1;
              break;
            }
          }
        }

        // If divisor < remainder, subtract divisor from remainder.
        if (cmp < 0) {

          // Remainder can't be more than 1 digit longer than divisor.
          // Equalise lengths using divisor with extra leading zero?
          for (bt = rl == bl ? b : bz; rl;) {
            if (r[--rl] < bt[rl]) {
              ri = rl;
              for (; ri && !r[--ri];) r[ri] = 9;
              --r[ri];
              r[rl] += 10;
            }
            r[rl] -= bt[rl];
          }

          for (; !r[0];) r.shift();
        } else {
          break;
        }
      }

      // Add the digit n to the result array.
      qc[qi++] = cmp ? n : ++n;

      // Update the remainder.
      if (r[0] && cmp) r[rl] = a[ai] || 0;
      else r = [a[ai]];

    } while ((ai++ < al || r[0] !== UNDEFINED) && k--);

    // Leading zero? Do not remove if result is simply zero (qi == 1).
    if (!qc[0] && qi != 1) {

      // There can't be more than one zero.
      qc.shift();
      q.e--;
      p--;
    }

    // Round?
    if (qi > p) round(q, p, Big.RM, r[0] !== UNDEFINED);

    return q;
  };


  /*
   * Return true if the value of this Big is equal to the value of Big y, otherwise return false.
   */
  P.eq = function (y) {
    return this.cmp(y) === 0;
  };


  /*
   * Return true if the value of this Big is greater than the value of Big y, otherwise return
   * false.
   */
  P.gt = function (y) {
    return this.cmp(y) > 0;
  };


  /*
   * Return true if the value of this Big is greater than or equal to the value of Big y, otherwise
   * return false.
   */
  P.gte = function (y) {
    return this.cmp(y) > -1;
  };


  /*
   * Return true if the value of this Big is less than the value of Big y, otherwise return false.
   */
  P.lt = function (y) {
    return this.cmp(y) < 0;
  };


  /*
   * Return true if the value of this Big is less than or equal to the value of Big y, otherwise
   * return false.
   */
  P.lte = function (y) {
    return this.cmp(y) < 1;
  };


  /*
   * Return a new Big whose value is the value of this Big minus the value of Big y.
   */
  P.minus = P.sub = function (y) {
    var i, j, t, xlty,
      x = this,
      Big = x.constructor,
      a = x.s,
      b = (y = new Big(y)).s;

    // Signs differ?
    if (a != b) {
      y.s = -b;
      return x.plus(y);
    }

    var xc = x.c.slice(),
      xe = x.e,
      yc = y.c,
      ye = y.e;

    // Either zero?
    if (!xc[0] || !yc[0]) {
      if (yc[0]) {
        y.s = -b;
      } else if (xc[0]) {
        y = new Big(x);
      } else {
        y.s = 1;
      }
      return y;
    }

    // Determine which is the bigger number. Prepend zeros to equalise exponents.
    if (a = xe - ye) {

      if (xlty = a < 0) {
        a = -a;
        t = xc;
      } else {
        ye = xe;
        t = yc;
      }

      t.reverse();
      for (b = a; b--;) t.push(0);
      t.reverse();
    } else {

      // Exponents equal. Check digit by digit.
      j = ((xlty = xc.length < yc.length) ? xc : yc).length;

      for (a = b = 0; b < j; b++) {
        if (xc[b] != yc[b]) {
          xlty = xc[b] < yc[b];
          break;
        }
      }
    }

    // x < y? Point xc to the array of the bigger number.
    if (xlty) {
      t = xc;
      xc = yc;
      yc = t;
      y.s = -y.s;
    }

    /*
     * Append zeros to xc if shorter. No need to add zeros to yc if shorter as subtraction only
     * needs to start at yc.length.
     */
    if ((b = (j = yc.length) - (i = xc.length)) > 0) for (; b--;) xc[i++] = 0;

    // Subtract yc from xc.
    for (b = i; j > a;) {
      if (xc[--j] < yc[j]) {
        for (i = j; i && !xc[--i];) xc[i] = 9;
        --xc[i];
        xc[j] += 10;
      }

      xc[j] -= yc[j];
    }

    // Remove trailing zeros.
    for (; xc[--b] === 0;) xc.pop();

    // Remove leading zeros and adjust exponent accordingly.
    for (; xc[0] === 0;) {
      xc.shift();
      --ye;
    }

    if (!xc[0]) {

      // n - n = +0
      y.s = 1;

      // Result must be zero.
      xc = [ye = 0];
    }

    y.c = xc;
    y.e = ye;

    return y;
  };


  /*
   * Return a new Big whose value is the value of this Big modulo the value of Big y.
   */
  P.mod = function (y) {
    var ygtx,
      x = this,
      Big = x.constructor,
      a = x.s,
      b = (y = new Big(y)).s;

    if (!y.c[0]) {
      throw Error(DIV_BY_ZERO);
    }

    x.s = y.s = 1;
    ygtx = y.cmp(x) == 1;
    x.s = a;
    y.s = b;

    if (ygtx) return new Big(x);

    a = Big.DP;
    b = Big.RM;
    Big.DP = Big.RM = 0;
    x = x.div(y);
    Big.DP = a;
    Big.RM = b;

    return this.minus(x.times(y));
  };


  /*
   * Return a new Big whose value is the value of this Big negated.
   */
  P.neg = function () {
    var x = new this.constructor(this);
    x.s = -x.s;
    return x;
  };


  /*
   * Return a new Big whose value is the value of this Big plus the value of Big y.
   */
  P.plus = P.add = function (y) {
    var e, k, t,
      x = this,
      Big = x.constructor;

    y = new Big(y);

    // Signs differ?
    if (x.s != y.s) {
      y.s = -y.s;
      return x.minus(y);
    }

    var xe = x.e,
      xc = x.c,
      ye = y.e,
      yc = y.c;

    // Either zero?
    if (!xc[0] || !yc[0]) {
      if (!yc[0]) {
        if (xc[0]) {
          y = new Big(x);
        } else {
          y.s = x.s;
        }
      }
      return y;
    }

    xc = xc.slice();

    // Prepend zeros to equalise exponents.
    // Note: reverse faster than unshifts.
    if (e = xe - ye) {
      if (e > 0) {
        ye = xe;
        t = yc;
      } else {
        e = -e;
        t = xc;
      }

      t.reverse();
      for (; e--;) t.push(0);
      t.reverse();
    }

    // Point xc to the longer array.
    if (xc.length - yc.length < 0) {
      t = yc;
      yc = xc;
      xc = t;
    }

    e = yc.length;

    // Only start adding at yc.length - 1 as the further digits of xc can be left as they are.
    for (k = 0; e; xc[e] %= 10) k = (xc[--e] = xc[e] + yc[e] + k) / 10 | 0;

    // No need to check for zero, as +x + +y != 0 && -x + -y != 0

    if (k) {
      xc.unshift(k);
      ++ye;
    }

    // Remove trailing zeros.
    for (e = xc.length; xc[--e] === 0;) xc.pop();

    y.c = xc;
    y.e = ye;

    return y;
  };


  /*
   * Return a Big whose value is the value of this Big raised to the power n.
   * If n is negative, round to a maximum of Big.DP decimal places using rounding
   * mode Big.RM.
   *
   * n {number} Integer, -MAX_POWER to MAX_POWER inclusive.
   */
  P.pow = function (n) {
    var x = this,
      one = new x.constructor('1'),
      y = one,
      isneg = n < 0;

    if (n !== ~~n || n < -MAX_POWER || n > MAX_POWER) {
      throw Error(INVALID + 'exponent');
    }

    if (isneg) n = -n;

    for (;;) {
      if (n & 1) y = y.times(x);
      n >>= 1;
      if (!n) break;
      x = x.times(x);
    }

    return isneg ? one.div(y) : y;
  };


  /*
   * Return a new Big whose value is the value of this Big rounded to a maximum precision of sd
   * significant digits using rounding mode rm, or Big.RM if rm is not specified.
   *
   * sd {number} Significant digits: integer, 1 to MAX_DP inclusive.
   * rm? {number} Rounding mode: 0 (down), 1 (half-up), 2 (half-even) or 3 (up).
   */
  P.prec = function (sd, rm) {
    if (sd !== ~~sd || sd < 1 || sd > MAX_DP) {
      throw Error(INVALID + 'precision');
    }
    return round(new this.constructor(this), sd, rm);
  };


  /*
   * Return a new Big whose value is the value of this Big rounded to a maximum of dp decimal places
   * using rounding mode rm, or Big.RM if rm is not specified.
   * If dp is negative, round to an integer which is a multiple of 10**-dp.
   * If dp is not specified, round to 0 decimal places.
   *
   * dp? {number} Integer, -MAX_DP to MAX_DP inclusive.
   * rm? {number} Rounding mode: 0 (down), 1 (half-up), 2 (half-even) or 3 (up).
   */
  P.round = function (dp, rm) {
    if (dp === UNDEFINED) dp = 0;
    else if (dp !== ~~dp || dp < -MAX_DP || dp > MAX_DP) {
      throw Error(INVALID_DP);
    }
    return round(new this.constructor(this), dp + this.e + 1, rm);
  };


  /*
   * Return a new Big whose value is the square root of the value of this Big, rounded, if
   * necessary, to a maximum of Big.DP decimal places using rounding mode Big.RM.
   */
  P.sqrt = function () {
    var r, c, t,
      x = this,
      Big = x.constructor,
      s = x.s,
      e = x.e,
      half = new Big('0.5');

    // Zero?
    if (!x.c[0]) return new Big(x);

    // Negative?
    if (s < 0) {
      throw Error(NAME + 'No square root');
    }

    // Estimate.
    s = Math.sqrt(+stringify(x, true, true));

    // Math.sqrt underflow/overflow?
    // Re-estimate: pass x coefficient to Math.sqrt as integer, then adjust the result exponent.
    if (s === 0 || s === 1 / 0) {
      c = x.c.join('');
      if (!(c.length + e & 1)) c += '0';
      s = Math.sqrt(c);
      e = ((e + 1) / 2 | 0) - (e < 0 || e & 1);
      r = new Big((s == 1 / 0 ? '5e' : (s = s.toExponential()).slice(0, s.indexOf('e') + 1)) + e);
    } else {
      r = new Big(s + '');
    }

    e = r.e + (Big.DP += 4);

    // Newton-Raphson iteration.
    do {
      t = r;
      r = half.times(t.plus(x.div(t)));
    } while (t.c.slice(0, e).join('') !== r.c.slice(0, e).join(''));

    return round(r, (Big.DP -= 4) + r.e + 1, Big.RM);
  };


  /*
   * Return a new Big whose value is the value of this Big times the value of Big y.
   */
  P.times = P.mul = function (y) {
    var c,
      x = this,
      Big = x.constructor,
      xc = x.c,
      yc = (y = new Big(y)).c,
      a = xc.length,
      b = yc.length,
      i = x.e,
      j = y.e;

    // Determine sign of result.
    y.s = x.s == y.s ? 1 : -1;

    // Return signed 0 if either 0.
    if (!xc[0] || !yc[0]) {
      y.c = [y.e = 0];
      return y;
    }

    // Initialise exponent of result as x.e + y.e.
    y.e = i + j;

    // If array xc has fewer digits than yc, swap xc and yc, and lengths.
    if (a < b) {
      c = xc;
      xc = yc;
      yc = c;
      j = a;
      a = b;
      b = j;
    }

    // Initialise coefficient array of result with zeros.
    for (c = new Array(j = a + b); j--;) c[j] = 0;

    // Multiply.

    // i is initially xc.length.
    for (i = b; i--;) {
      b = 0;

      // a is yc.length.
      for (j = a + i; j > i;) {

        // Current sum of products at this digit position, plus carry.
        b = c[j] + yc[i] * xc[j - i - 1] + b;
        c[j--] = b % 10;

        // carry
        b = b / 10 | 0;
      }

      c[j] = b;
    }

    // Increment result exponent if there is a final carry, otherwise remove leading zero.
    if (b) ++y.e;
    else c.shift();

    // Remove trailing zeros.
    for (i = c.length; !c[--i];) c.pop();
    y.c = c;

    return y;
  };


  /*
   * Return a string representing the value of this Big in exponential notation rounded to dp fixed
   * decimal places using rounding mode rm, or Big.RM if rm is not specified.
   *
   * dp? {number} Decimal places: integer, 0 to MAX_DP inclusive.
   * rm? {number} Rounding mode: 0 (down), 1 (half-up), 2 (half-even) or 3 (up).
   */
  P.toExponential = function (dp, rm) {
    var x = this,
      n = x.c[0];

    if (dp !== UNDEFINED) {
      if (dp !== ~~dp || dp < 0 || dp > MAX_DP) {
        throw Error(INVALID_DP);
      }
      x = round(new x.constructor(x), ++dp, rm);
      for (; x.c.length < dp;) x.c.push(0);
    }

    return stringify(x, true, !!n);
  };


  /*
   * Return a string representing the value of this Big in normal notation rounded to dp fixed
   * decimal places using rounding mode rm, or Big.RM if rm is not specified.
   *
   * dp? {number} Decimal places: integer, 0 to MAX_DP inclusive.
   * rm? {number} Rounding mode: 0 (down), 1 (half-up), 2 (half-even) or 3 (up).
   *
   * (-0).toFixed(0) is '0', but (-0.1).toFixed(0) is '-0'.
   * (-0).toFixed(1) is '0.0', but (-0.01).toFixed(1) is '-0.0'.
   */
  P.toFixed = function (dp, rm) {
    var x = this,
      n = x.c[0];

    if (dp !== UNDEFINED) {
      if (dp !== ~~dp || dp < 0 || dp > MAX_DP) {
        throw Error(INVALID_DP);
      }
      x = round(new x.constructor(x), dp + x.e + 1, rm);

      // x.e may have changed if the value is rounded up.
      for (dp = dp + x.e + 1; x.c.length < dp;) x.c.push(0);
    }

    return stringify(x, false, !!n);
  };


  /*
   * Return a string representing the value of this Big.
   * Return exponential notation if this Big has a positive exponent equal to or greater than
   * Big.PE, or a negative exponent equal to or less than Big.NE.
   * Omit the sign for negative zero.
   */
  P.toJSON = P.toString = function () {
    var x = this,
      Big = x.constructor;
    return stringify(x, x.e <= Big.NE || x.e >= Big.PE, !!x.c[0]);
  };


  /*
   * Return the value of this Big as a primitve number.
   */
  P.toNumber = function () {
    var n = +stringify(this, true, true);
    if (this.constructor.strict === true && !this.eq(n.toString())) {
      throw Error(NAME + 'Imprecise conversion');
    }
    return n;
  };


  /*
   * Return a string representing the value of this Big rounded to sd significant digits using
   * rounding mode rm, or Big.RM if rm is not specified.
   * Use exponential notation if sd is less than the number of digits necessary to represent
   * the integer part of the value in normal notation.
   *
   * sd {number} Significant digits: integer, 1 to MAX_DP inclusive.
   * rm? {number} Rounding mode: 0 (down), 1 (half-up), 2 (half-even) or 3 (up).
   */
  P.toPrecision = function (sd, rm) {
    var x = this,
      Big = x.constructor,
      n = x.c[0];

    if (sd !== UNDEFINED) {
      if (sd !== ~~sd || sd < 1 || sd > MAX_DP) {
        throw Error(INVALID + 'precision');
      }
      x = round(new Big(x), sd, rm);
      for (; x.c.length < sd;) x.c.push(0);
    }

    return stringify(x, sd <= x.e || x.e <= Big.NE || x.e >= Big.PE, !!n);
  };


  /*
   * Return a string representing the value of this Big.
   * Return exponential notation if this Big has a positive exponent equal to or greater than
   * Big.PE, or a negative exponent equal to or less than Big.NE.
   * Include the sign for negative zero.
   */
  P.valueOf = function () {
    var x = this,
      Big = x.constructor;
    if (Big.strict === true) {
      throw Error(NAME + 'valueOf disallowed');
    }
    return stringify(x, x.e <= Big.NE || x.e >= Big.PE, true);
  };


  // Export


  Big = _Big_();

  Big['default'] = Big.Big = Big;

  //AMD.
  if (typeof define === 'function' && define.amd) {
    define(function () { return Big; });

  // Node and other CommonJS-like environments that support module.exports.
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports = Big;

  //Browser.
  } else {
    GLOBAL.Big = Big;
  }
})(this);

},{}],3:[function(require,module,exports){
(function (Buffer){(function (){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

}).call(this)}).call(this,require("buffer").Buffer)

},{"base64-js":1,"buffer":3,"ieee754":4}],4:[function(require,module,exports){
/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],5:[function(require,module,exports){
(function (Buffer){(function (){
"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.btnConnectKeplr_onClick = btnConnectKeplr_onClick;
var _big = _interopRequireDefault(require("big.js"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return e; }; var t, e = {}, r = Object.prototype, n = r.hasOwnProperty, o = Object.defineProperty || function (t, e, r) { t[e] = r.value; }, i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag"; function define(t, e, r) { return Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }), t[e]; } try { define({}, ""); } catch (t) { define = function define(t, e, r) { return t[e] = r; }; } function wrap(t, e, r, n) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype), c = new Context(n || []); return o(a, "_invoke", { value: makeInvokeMethod(t, r, c) }), a; } function tryCatch(t, e, r) { try { return { type: "normal", arg: t.call(e, r) }; } catch (t) { return { type: "throw", arg: t }; } } e.wrap = wrap; var h = "suspendedStart", l = "suspendedYield", f = "executing", s = "completed", y = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var p = {}; define(p, a, function () { return this; }); var d = Object.getPrototypeOf, v = d && d(d(values([]))); v && v !== r && n.call(v, a) && (p = v); var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p); function defineIteratorMethods(t) { ["next", "throw", "return"].forEach(function (e) { define(t, e, function (t) { return this._invoke(e, t); }); }); } function AsyncIterator(t, e) { function invoke(r, o, i, a) { var c = tryCatch(t[r], t, o); if ("throw" !== c.type) { var u = c.arg, h = u.value; return h && "object" == _typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) { invoke("next", t, i, a); }, function (t) { invoke("throw", t, i, a); }) : e.resolve(h).then(function (t) { u.value = t, i(u); }, function (t) { return invoke("throw", t, i, a); }); } a(c.arg); } var r; o(this, "_invoke", { value: function value(t, n) { function callInvokeWithMethodAndArg() { return new e(function (e, r) { invoke(t, n, e, r); }); } return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(e, r, n) { var o = h; return function (i, a) { if (o === f) throw Error("Generator is already running"); if (o === s) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var c = n.delegate; if (c) { var u = maybeInvokeDelegate(c, n); if (u) { if (u === y) continue; return u; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (o === h) throw o = s, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = f; var p = tryCatch(e, r, n); if ("normal" === p.type) { if (o = n.done ? s : l, p.arg === y) continue; return { value: p.arg, done: n.done }; } "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg); } }; } function maybeInvokeDelegate(e, r) { var n = r.method, o = e.iterator[n]; if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y; var i = tryCatch(o, e.iterator, r.arg); if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y; var a = i.arg; return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y); } function pushTryEntry(t) { var e = { tryLoc: t[0] }; 1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e); } function resetTryEntry(t) { var e = t.completion || {}; e.type = "normal", delete e.arg, t.completion = e; } function Context(t) { this.tryEntries = [{ tryLoc: "root" }], t.forEach(pushTryEntry, this), this.reset(!0); } function values(e) { if (e || "" === e) { var r = e[a]; if (r) return r.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) { var o = -1, i = function next() { for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next; return next.value = t, next.done = !0, next; }; return i.next = i; } } throw new TypeError(_typeof(e) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), o(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) { var e = "function" == typeof t && t.constructor; return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name)); }, e.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t; }, e.awrap = function (t) { return { __await: t }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () { return this; }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(wrap(t, r, n, o), i); return e.isGeneratorFunction(r) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () { return this; }), define(g, "toString", function () { return "[object Generator]"; }), e.keys = function (t) { var e = Object(t), r = []; for (var n in e) r.push(n); return r.reverse(), function next() { for (; r.length;) { var t = r.pop(); if (t in e) return next.value = t, next.done = !1, next; } return next.done = !0, next; }; }, e.values = values, Context.prototype = { constructor: Context, reset: function reset(e) { if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0].completion; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(e) { if (this.done) throw e; var r = this; function handle(n, o) { return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o; } for (var o = this.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i.completion; if ("root" === i.tryLoc) return handle("end"); if (i.tryLoc <= this.prev) { var c = n.call(i, "catchLoc"), u = n.call(i, "finallyLoc"); if (c && u) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } else if (c) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); } else { if (!u) throw Error("try statement without catch or finally"); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } } } }, abrupt: function abrupt(t, e) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var o = this.tryEntries[r]; if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) { var i = o; break; } } i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null); var a = i ? i.completion : {}; return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a); }, complete: function complete(t, e) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y; }, finish: function finish(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y; } }, "catch": function _catch(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.tryLoc === t) { var n = r.completion; if ("throw" === n.type) { var o = n.arg; resetTryEntry(r); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(e, r, n) { return this.delegate = { iterator: values(e), resultName: r, nextLoc: n }, "next" === this.method && (this.arg = t), y; } }, e; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; } // Import Big.js
// Configure Big.js for high precision
_big["default"].DP = 50; // Set decimal places
_big["default"].RM = _big["default"].roundHalfUp; // Rounding mode

window.listDeposits = listDeposits;
window.useConnectedWalletAddress = useConnectedWalletAddress;
window.btnDisconnectWallet = btnDisconnectWallet;
window.btnConnectWallet = btnConnectWallet;

// Configuration
var LCD_URL = "https://rest.cosmos.directory/lumnetwork";
var RPC_URL = "https://rpc.cosmos.directory/lumnetwork";
var CHAIN_ID = "lum-network-1";
var DENOM = "ulum";
var GAS_LIMIT = 200000;
var GAS_PRICE = "0.0025"; // in ulum

// Hardcoded denomination mapping
var DENOMINATIONS = {
  'ibc/A8C2D23A1E6F95DA4E48BA349667E322BD7A6C996D8A4AAE8BA72E190F3D1477': {
    name: 'ATOM',
    decimals: 6
  },
  'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2': {
    name: 'ATOM',
    decimals: 6
  },
  'ibc/51A818D8BBC385C152415882286C62169C05498B8EBCFB38310B1367583860FF': {
    name: 'HUAHUA',
    decimals: 6
  },
  'ibc/47BD209179859CDE4A2806763D7189B6E6FE13A17880FE2B42DE1E6C1E329E23': {
    name: 'OSMO',
    decimals: 6
  },
  'ibc/110A26548C514042AFDDEB1D4B46E71C1D43D9672659A3C958D7365FEECD9388': {
    name: 'INJ',
    decimals: 18
  }
};

// Loading state management
var isLoading = false;
var totalDeposits = 0;
var currentPage = 1;
_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
  var urlParams, walletAddress;
  return _regeneratorRuntime().wrap(function _callee$(_context) {
    while (1) switch (_context.prev = _context.next) {
      case 0:
        _context.next = 2;
        return getKeplr();
      case 2:
        _context.next = 4;
        return keplr_connectLum();
      case 4:
        // check URL for id field, and set value of orderId input
        urlParams = new URLSearchParams(window.location.search);
        walletAddress = urlParams.get('walletAddress');
        if (walletAddress) {
          document.getElementById("searchWalletAddress").value = walletAddress;
        }
      case 7:
      case "end":
        return _context.stop();
    }
  }, _callee);
}))();

// // INITIALIZATION:
function getKeplr() {
  return _getKeplr.apply(this, arguments);
}
function _getKeplr() {
  _getKeplr = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2() {
    return _regeneratorRuntime().wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          if (!window.keplr) {
            _context2.next = 2;
            break;
          }
          return _context2.abrupt("return", window.keplr);
        case 2:
          if (!(document.readyState === "complete")) {
            _context2.next = 4;
            break;
          }
          return _context2.abrupt("return", window.keplr);
        case 4:
          return _context2.abrupt("return", new Promise(function (resolve) {
            var _documentStateChange = function documentStateChange(event) {
              if (event.target && event.target.readyState === "complete") {
                resolve(window.keplr);
                document.removeEventListener("readystatechange", _documentStateChange);
              }
            };
            document.addEventListener("readystatechange", _documentStateChange);
          }));
        case 5:
        case "end":
          return _context2.stop();
      }
    }, _callee2);
  }));
  return _getKeplr.apply(this, arguments);
}
function keplr_connectLum() {
  return _keplr_connectLum.apply(this, arguments);
} // get lum wallet from user's selected account in keplr extension
function _keplr_connectLum() {
  _keplr_connectLum = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee4() {
    var _window$keplr;
    return _regeneratorRuntime().wrap(function _callee4$(_context4) {
      while (1) switch (_context4.prev = _context4.next) {
        case 0:
          _context4.next = 2;
          return suggestChainLum().then(function () {
            // Chain suggested successfully
            console.log("Chain suggested successfully");
          })["catch"](function (error) {
            console.error("Error suggesting chain:", error);
          });
        case 2:
          _context4.next = 4;
          return (_window$keplr = window.keplr) === null || _window$keplr === void 0 ? void 0 : _window$keplr.enable("lum-network-1").then(/*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3() {
            return _regeneratorRuntime().wrap(function _callee3$(_context3) {
              while (1) switch (_context3.prev = _context3.next) {
                case 0:
                  // Connected
                  keplr_chains_onConnected();
                case 1:
                case "end":
                  return _context3.stop();
              }
            }, _callee3);
          })))["catch"](function () {
            // Rejected
            keplr_chains_onRejected();
          });
        case 4:
        case "end":
          return _context4.stop();
      }
    }, _callee4);
  }));
  return _keplr_connectLum.apply(this, arguments);
}
function getLumWallet() {
  return _getLumWallet.apply(this, arguments);
}
function _getLumWallet() {
  _getLumWallet = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee5() {
    var _window$keplr2;
    var wallet;
    return _regeneratorRuntime().wrap(function _callee5$(_context5) {
      while (1) switch (_context5.prev = _context5.next) {
        case 0:
          _context5.next = 2;
          return (_window$keplr2 = window.keplr) === null || _window$keplr2 === void 0 ? void 0 : _window$keplr2.getKey("lum-network-1").then(function (user_key) {
            return user_key;
          });
        case 2:
          wallet = _context5.sent;
          return _context5.abrupt("return", wallet);
        case 4:
        case "end":
          return _context5.stop();
      }
    }, _callee5);
  }));
  return _getLumWallet.apply(this, arguments);
}
window.getLumWallet = getLumWallet;

// EVENT HANDLERS
function keplr_chains_onConnected() {
  return _keplr_chains_onConnected.apply(this, arguments);
}
function _keplr_chains_onConnected() {
  _keplr_chains_onConnected = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee6() {
    var wallet;
    return _regeneratorRuntime().wrap(function _callee6$(_context6) {
      while (1) switch (_context6.prev = _context6.next) {
        case 0:
          _context6.next = 2;
          return getLumWallet();
        case 2:
          wallet = _context6.sent;
          ui_setWallet(wallet);

          // register event handler: if user changes account:
          window.addEventListener("keplr_keystorechange", keplr_keystore_onChange);
        case 5:
        case "end":
          return _context6.stop();
      }
    }, _callee6);
  }));
  return _keplr_chains_onConnected.apply(this, arguments);
}
function keplr_chains_onRejected() {
  return _keplr_chains_onRejected.apply(this, arguments);
}
function _keplr_chains_onRejected() {
  _keplr_chains_onRejected = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee7() {
    return _regeneratorRuntime().wrap(function _callee7$(_context7) {
      while (1) switch (_context7.prev = _context7.next) {
        case 0:
          ui_setWallet(undefined);
        case 1:
        case "end":
          return _context7.stop();
      }
    }, _callee7);
  }));
  return _keplr_chains_onRejected.apply(this, arguments);
}
function keplr_keystore_onChange(_x) {
  return _keplr_keystore_onChange.apply(this, arguments);
} // EXPORTED TO A GLOBAL "module" OBJECT FOR INLINE HTML DOM EVENT LISTENERS
function _keplr_keystore_onChange() {
  _keplr_keystore_onChange = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee8(e) {
    var wallet;
    return _regeneratorRuntime().wrap(function _callee8$(_context8) {
      while (1) switch (_context8.prev = _context8.next) {
        case 0:
          _context8.next = 2;
          return getLumWallet();
        case 2:
          wallet = _context8.sent;
          ui_setWallet(wallet);
        case 4:
        case "end":
          return _context8.stop();
      }
    }, _callee8);
  }));
  return _keplr_keystore_onChange.apply(this, arguments);
}
function btnConnectKeplr_onClick() {
  return _btnConnectKeplr_onClick.apply(this, arguments);
}
function _btnConnectKeplr_onClick() {
  _btnConnectKeplr_onClick = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee9() {
    return _regeneratorRuntime().wrap(function _callee9$(_context9) {
      while (1) switch (_context9.prev = _context9.next) {
        case 0:
          _context9.next = 2;
          return keplr_connectLum();
        case 2:
        case "end":
          return _context9.stop();
      }
    }, _callee9);
  }));
  return _btnConnectKeplr_onClick.apply(this, arguments);
}
function ui_setWallet(_x2) {
  return _ui_setWallet.apply(this, arguments);
} // function to reinitialize ui
function _ui_setWallet() {
  _ui_setWallet = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee10(wallet) {
    return _regeneratorRuntime().wrap(function _callee10$(_context10) {
      while (1) switch (_context10.prev = _context10.next) {
        case 0:
          if (wallet) {
            document.getElementById("connectedWalletAddress").innerHTML = wallet.bech32Address;
            ui_showElementById("walletContainer");
            // ui_showElementById("orders");
            ui_hideElementById("btnConnect");

            // await listDeposits(wallet.bech32Address);
            // await fetchAllDeposits(wallet.bech32Address);
          } else {
            ui_hideElementById("walletContainer");
            // ui_hideElementById("orders");
            ui_showElementById("btnConnect");
          }
          ui_reinitialize();
        case 2:
        case "end":
          return _context10.stop();
      }
    }, _callee10);
  }));
  return _ui_setWallet.apply(this, arguments);
}
function ui_reinitialize() {
  ui_hideResponse();
  ui_hideError();
}

/* show and hide response */
// function to update the last transaction hash
function ui_showResponse(result) {
  document.getElementById("divResponse").innerHTML = JSON.stringify(result, null, 2);
  ui_showElementById("responseContainer");
}
function ui_hideResponse() {
  document.getElementById("divResponse").innerHTML = "";
  ui_hideElementById("responseContainer");
}

/* show and hide error messages */
// error handlers
function ui_showError(errorMessage) {
  document.getElementById("divError").innerHTML = errorMessage;
  document.getElementById("errorContainer").classList.remove('hidden');
}
function ui_hideError() {
  document.getElementById("divError").innerHTML = "";
  document.getElementById("errorContainer").classList.add('hidden');
}
function btnDisconnectWallet() {
  // window.keplr?.signOut("osmosis-1");
  ui_setWallet(undefined);
}
function btnConnectWallet() {
  btnConnectKeplr_onClick();
}
function ui_showElementById(elementId) {
  try {
    document.getElementById(elementId).classList.remove('hidden');
  } catch (error) {
    console.warn("ui_showElementById: elementId ".concat(elementId, " not found"));
  }
}
function ui_hideElementById(elementId) {
  try {
    document.getElementById(elementId).classList.add('hidden');
  } catch (error) {
    console.warn("ui_hideElementById: elementId ".concat(elementId, " not found"));
  }
}
function useConnectedWalletAddress() {
  var connectedWalletAddress = document.getElementById("connectedWalletAddress").textContent.trim();
  document.getElementById("searchWalletAddress").value = connectedWalletAddress;

  // update url's search params for walletAddress:
  var url = new URL(window.location.href);
  url.searchParams.set("walletAddress", connectedWalletAddress);
  window.history.replaceState({}, '', url); // update the URL without reloading
}

// Helper function to toggle loading state
function toggleLoading(isLoadingState) {
  var progressMessage = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";
  var contextMessage = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "";
  var loadingMask = document.getElementById('loadingMask');
  var loadingProgress = document.getElementById('loadingProgress');
  var loadingContext = document.getElementById('loadingContext');
  isLoading = isLoadingState;
  loadingMask.classList.toggle('active', isLoadingState);
  if (isLoadingState) {
    loadingProgress.textContent = progressMessage || "Loading deposits...";
    loadingContext.textContent = contextMessage || "Please wait while we fetch your deposits...";
  }

  // Disable/enable all buttons when loading
  var buttons = document.querySelectorAll('button');
  buttons.forEach(function (button) {
    button.disabled = isLoadingState;
    button.classList.toggle('loading', isLoadingState);
  });
}

// Helper to display errors
function showError(message) {
  document.getElementById("error").textContent = message;
}

// Fetch all deposits and return all deposits and filtered user deposits.
function fetchAllDeposits(_x3) {
  return _fetchAllDeposits.apply(this, arguments);
} // Query user deposits
function _fetchAllDeposits() {
  _fetchAllDeposits = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee11(address) {
    var nextKey, limit, userDeposits, allDeposits, _data$pagination, url, response, data, pageDeposits, filteredDeposits;
    return _regeneratorRuntime().wrap(function _callee11$(_context11) {
      while (1) switch (_context11.prev = _context11.next) {
        case 0:
          totalDeposits = 0;
          currentPage = 1;
          nextKey = null;
          limit = 100;
          userDeposits = [];
          allDeposits = [];
        case 6:
          _context11.prev = 6;
          url = "".concat(LCD_URL, "/lum-network/millions/deposits?pagination.limit=").concat(limit).concat(nextKey ? "&pagination.key=".concat(encodeURIComponent(nextKey)) : "");
          console.log("Fetching page ".concat(currentPage, ": ").concat(url));
          _context11.next = 11;
          return fetch(url);
        case 11:
          response = _context11.sent;
          if (response.ok) {
            _context11.next = 15;
            break;
          }
          console.error("HTTP error: ".concat(response.status));
          throw new Error("HTTP error: ".concat(response.status));
        case 15:
          _context11.next = 17;
          return response.json();
        case 17:
          data = _context11.sent;
          console.log("Page ".concat(currentPage, " response:"), data);
          pageDeposits = data.deposits || [];
          filteredDeposits = pageDeposits.filter(function (deposit) {
            return deposit.depositor_address === address;
          });
          userDeposits.push.apply(userDeposits, _toConsumableArray(filteredDeposits));
          allDeposits.push.apply(allDeposits, _toConsumableArray(pageDeposits));
          totalDeposits += filteredDeposits.length;

          // Update loading progress
          toggleLoading(true, "Found ".concat(totalDeposits, " deposits for address..."), "Processing page ".concat(currentPage, " of deposits..."));
          nextKey = ((_data$pagination = data.pagination) === null || _data$pagination === void 0 ? void 0 : _data$pagination.next_key) || null;
          currentPage++;
          _context11.next = 33;
          break;
        case 29:
          _context11.prev = 29;
          _context11.t0 = _context11["catch"](6);
          console.error('Error fetching deposits:', _context11.t0);
          throw new Error("Error fetching deposits page: ".concat(_context11.t0.message));
        case 33:
          if (nextKey) {
            _context11.next = 6;
            break;
          }
        case 34:
          console.log('User deposits count:', userDeposits.length);
          return _context11.abrupt("return", {
            userDeposits: userDeposits,
            allDeposits: allDeposits
          });
        case 36:
        case "end":
          return _context11.stop();
      }
    }, _callee11, null, [[6, 29]]);
  }));
  return _fetchAllDeposits.apply(this, arguments);
}
function listDeposits() {
  return _listDeposits.apply(this, arguments);
}
function _listDeposits() {
  _listDeposits = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee12() {
    var address, _yield$fetchAllDeposi, userDeposits, allDeposits, poolStats, tbody;
    return _regeneratorRuntime().wrap(function _callee12$(_context12) {
      while (1) switch (_context12.prev = _context12.next) {
        case 0:
          if (!isLoading) {
            _context12.next = 2;
            break;
          }
          return _context12.abrupt("return");
        case 2:
          address = document.getElementById("searchWalletAddress").value.trim();
          if (address.startsWith("lum1")) {
            _context12.next = 6;
            break;
          }
          showError("Please enter a valid Lum address (lum1...)");
          return _context12.abrupt("return");
        case 6:
          _context12.prev = 6;
          showError("");
          toggleLoading(true, "Fetching global statistics...", "Please wait...");

          // Then fetch user deposits
          _context12.next = 11;
          return fetchAllDeposits(address);
        case 11:
          _yield$fetchAllDeposi = _context12.sent;
          userDeposits = _yield$fetchAllDeposi.userDeposits;
          allDeposits = _yield$fetchAllDeposi.allDeposits;
          // Process pool statistics
          poolStats = allDeposits.reduce(function (stats, deposit) {
            var poolId = deposit.pool_id;
            var coingeckoId = null;
            if (!stats[poolId]) {
              switch (poolId) {
                case "2":
                  coingeckoId = 'cosmos';
                  break;
                case "3":
                  coingeckoId = 'chihuahua-chain';
                  break;
                case "4":
                  coingeckoId = 'osmosis';
                  break;
                case "5":
                  coingeckoId = 'injective-protocol';
                  break;
                default:
                  coingeckoId = null;
              }
              stats[poolId] = {
                pool_id: poolId,
                total_deposited: {
                  denom: deposit.amount.denom,
                  amount: '0'
                },
                deposit_count: 0,
                coingecko_id: coingeckoId
              };
            }
            // Add to total deposited
            stats[poolId].total_deposited.amount = (BigInt(stats[poolId].total_deposited.amount) + BigInt(deposit.amount.amount)).toString();
            // Increment deposit count
            stats[poolId].deposit_count++;
            return stats;
          }, {}); // Update global deposits table
          _context12.next = 17;
          return updateGlobalDepositsTable(Object.values(poolStats));
        case 17:
          tbody = document.getElementById("depositsBody");
          tbody.innerHTML = "";

          // Check if there are deposits for this address
          if (!(userDeposits.length === 0)) {
            _context12.next = 22;
            break;
          }
          showError("No deposits found for this address.");
          return _context12.abrupt("return");
        case 22:
          // Display deposits
          userDeposits.forEach(function (deposit) {
            var row = document.createElement("tr");
            var denomInfo = DENOMINATIONS[deposit.amount.denom];
            var amount = denomInfo ? "".concat(deposit.amount.amount / Math.pow(10, denomInfo.decimals), " ").concat(denomInfo.name) : "".concat(deposit.amount, " ").concat(deposit.amount.denom);
            row.innerHTML = "\n                <td>".concat(deposit.deposit_id, "</td>\n                <td>").concat(deposit.pool_id, "</td>\n                <td>").concat(amount, "</td>\n                <td><button onclick=\"withdrawDeposit('").concat(address, "', '").concat(deposit.pool_id, "', '").concat(deposit.deposit_id, "')\" class=\"action-button\">Withdraw</button></td>\n            ");
            tbody.appendChild(row);
          });
          _context12.next = 28;
          break;
        case 25:
          _context12.prev = 25;
          _context12.t0 = _context12["catch"](6);
          showError("Error fetching deposits: ".concat(_context12.t0.message));
        case 28:
          _context12.prev = 28;
          toggleLoading(false);
          return _context12.finish(28);
        case 31:
        case "end":
          return _context12.stop();
      }
    }, _callee12, null, [[6, 25, 28, 31]]);
  }));
  return _listDeposits.apply(this, arguments);
}
function updateGlobalDepositsTable(_x4) {
  return _updateGlobalDepositsTable.apply(this, arguments);
}
function _updateGlobalDepositsTable() {
  _updateGlobalDepositsTable = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee13(globalDeposits) {
    var tbody, coingeckoIds, uniqueCoingeckoIds, prices, globalDepositsWithPrices;
    return _regeneratorRuntime().wrap(function _callee13$(_context13) {
      while (1) switch (_context13.prev = _context13.next) {
        case 0:
          tbody = document.getElementById("globalDepositsBody");
          tbody.innerHTML = "";
          coingeckoIds = globalDeposits.map(function (pool) {
            return pool.coingecko_id;
          }).filter(function (id) {
            return id !== null;
          });
          uniqueCoingeckoIds = _toConsumableArray(new Set(coingeckoIds));
          _context13.next = 6;
          return getCryptoPrices(uniqueCoingeckoIds.toString());
        case 6:
          prices = _context13.sent;
          globalDepositsWithPrices = globalDeposits.map(function (pool) {
            var price = new _big["default"](prices[pool.coingecko_id] || 0);
            var amount = new _big["default"](formatAmountByDenom(pool.total_deposited));

            // Calculate with high precision
            var valueUSD = amount.mul(price);
            // Convert to string with 2 decimal places
            var valueUSDRounded = valueUSD.toFixed(2, 1); // 1 is the rounding mode for roundHalfUp

            return _objectSpread(_objectSpread({}, pool), {}, {
              valueUSD: valueUSDRounded
            });
          });
          globalDepositsWithPrices.forEach(function (pool) {
            var row = document.createElement("tr");
            row.innerHTML = "\n            <td>".concat(pool.pool_id, "</td>\n            <td>").concat(formatAmount(pool.total_deposited), "</td>\n            <td>").concat(pool.deposit_count, "</td>\n            <td>").concat(pool.valueUSD ? pool.valueUSD : 'N/A', "</td>\n        ");
            // <td>${pool.valueUSD ? pool.valueUSD.toFixed(2) : 'N/A'}</td>
            tbody.appendChild(row);
          });
        case 9:
        case "end":
          return _context13.stop();
      }
    }, _callee13);
  }));
  return _updateGlobalDepositsTable.apply(this, arguments);
}
function getCryptoPrices(_x5) {
  return _getCryptoPrices.apply(this, arguments);
}
function _getCryptoPrices() {
  _getCryptoPrices = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee14(strIds) {
    var apiUrl, response, data, prices;
    return _regeneratorRuntime().wrap(function _callee14$(_context14) {
      while (1) switch (_context14.prev = _context14.next) {
        case 0:
          // CoinGecko API endpoint for fetching prices
          apiUrl = "https://api.coingecko.com/api/v3/simple/price?ids=".concat(strIds, "&vs_currencies=usd");
          _context14.prev = 1;
          _context14.next = 4;
          return fetch(apiUrl);
        case 4:
          response = _context14.sent;
          if (response.ok) {
            _context14.next = 7;
            break;
          }
          throw new Error('Network response was not ok');
        case 7:
          _context14.next = 9;
          return response.json();
        case 9:
          data = _context14.sent;
          // Calculate the USD value for each cryptocurrency
          prices = Object.keys(data).reduce(function (acc, key) {
            acc[key] = data[key].usd;
            return acc;
          }, {});
          return _context14.abrupt("return", prices);
        case 14:
          _context14.prev = 14;
          _context14.t0 = _context14["catch"](1);
          console.error('Error fetching prices:', _context14.t0);
          throw _context14.t0;
        case 18:
        case "end":
          return _context14.stop();
      }
    }, _callee14, null, [[1, 14]]);
  }));
  return _getCryptoPrices.apply(this, arguments);
}
function formatAmount(amount) {
  var denomInfo = DENOMINATIONS[amount.denom];
  return denomInfo ? "".concat(amount.amount / Math.pow(10, denomInfo.decimals), " ").concat(denomInfo.name) : "".concat(amount.amount, " ").concat(amount.denom);
}
function formatAmountByDenom(amount) {
  var denomInfo = DENOMINATIONS[amount.denom];
  return denomInfo ? "".concat(amount.amount / Math.pow(10, denomInfo.decimals)) : "".concat(amount.amount);
}

// Withdraw a deposit
function withdrawDeposit(_x6, _x7, _x8) {
  return _withdrawDeposit.apply(this, arguments);
} // Helper to serialize transaction body
function _withdrawDeposit() {
  _withdrawDeposit = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee15(depositor, poolId, depositId) {
    var _broadcastResult$resu, offlineSigner, accounts, accountResponse, accountData, account, sequence, accountNumber, msg, fee, signDoc, signed, tx, broadcastResponse, broadcastResult, _broadcastResult$resu2;
    return _regeneratorRuntime().wrap(function _callee15$(_context15) {
      while (1) switch (_context15.prev = _context15.next) {
        case 0:
          if (!isLoading) {
            _context15.next = 2;
            break;
          }
          return _context15.abrupt("return");
        case 2:
          _context15.prev = 2;
          showError("");
          toggleLoading(true, "Preparing withdrawal...", "Please confirm the transaction in your wallet");

          // Ensure Keplr is available
          if (window.keplr) {
            _context15.next = 8;
            break;
          }
          showError("Keplr wallet not detected. Please install Keplr extension.");
          return _context15.abrupt("return");
        case 8:
          _context15.next = 10;
          return window.keplr.enable(CHAIN_ID);
        case 10:
          offlineSigner = window.keplr.getOfflineSigner(CHAIN_ID);
          _context15.next = 13;
          return offlineSigner.getAccounts();
        case 13:
          accounts = _context15.sent;
          if (!(accounts[0].address !== depositor)) {
            _context15.next = 17;
            break;
          }
          showError("Keplr address does not match provided address.");
          return _context15.abrupt("return");
        case 17:
          _context15.next = 19;
          return fetch("".concat(LCD_URL, "/cosmos/auth/v1beta1/accounts/").concat(depositor));
        case 19:
          accountResponse = _context15.sent;
          _context15.next = 22;
          return accountResponse.json();
        case 22:
          accountData = _context15.sent;
          account = accountData.account;
          sequence = account.sequence;
          accountNumber = account.account_number; // Construct MsgWithdrawDeposit
          msg = {
            type: "lum-network/millions/MsgWithdrawDeposit",
            value: {
              depositor_address: depositor,
              pool_id: poolId,
              deposit_id: depositId
            }
          }; // Fee
          fee = {
            amount: [{
              denom: DENOM,
              amount: Math.ceil(GAS_LIMIT * parseFloat(GAS_PRICE)).toString()
            }],
            gas: GAS_LIMIT.toString()
          }; // Sign transaction
          signDoc = {
            body: {
              messages: [msg],
              memo: "",
              timeout_height: "0",
              extension_options: [],
              non_critical_extension_options: []
            },
            auth_info: {
              signer_infos: [{
                public_key: {
                  type: "tendermint/PubKeySecp256k1",
                  key: accounts[0].pubkey
                },
                mode_info: {
                  single: {
                    mode: "SIGN_MODE_DIRECT"
                  }
                },
                sequence: sequence.toString()
              }],
              fee: fee
            },
            chain_id: CHAIN_ID,
            account_number: accountNumber.toString()
          };
          _context15.next = 31;
          return window.keplr.signDirect(CHAIN_ID, depositor, {
            bodyBytes: serializeBody(signDoc.body),
            authInfoBytes: serializeAuthInfo(signDoc.auth_info),
            chainId: CHAIN_ID,
            accountNumber: accountNumber
          });
        case 31:
          signed = _context15.sent;
          // Construct transaction
          tx = {
            signatures: [signed.signature.signature],
            body: signed.signed.body,
            auth_info: signed.signed.auth_info
          }; // Broadcast transaction
          _context15.next = 35;
          return fetch("".concat(RPC_URL, "/txs"), {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              tx: tx,
              mode: "BROADCAST_MODE_BLOCK"
            })
          });
        case 35:
          broadcastResponse = _context15.sent;
          _context15.next = 38;
          return broadcastResponse.json();
        case 38:
          broadcastResult = _context15.sent;
          if (!(((_broadcastResult$resu = broadcastResult.result) === null || _broadcastResult$resu === void 0 ? void 0 : _broadcastResult$resu.code) !== 0)) {
            _context15.next = 41;
            break;
          }
          throw new Error(((_broadcastResult$resu2 = broadcastResult.result) === null || _broadcastResult$resu2 === void 0 ? void 0 : _broadcastResult$resu2.raw_log) || "Transaction failed");
        case 41:
          alert("Withdrawal successful! Tx Hash: ".concat(broadcastResult.result.txhash));
          listDeposits(); // Refresh deposit list
          _context15.next = 48;
          break;
        case 45:
          _context15.prev = 45;
          _context15.t0 = _context15["catch"](2);
          showError("Error withdrawing deposit: ".concat(_context15.t0.message));
        case 48:
          _context15.prev = 48;
          toggleLoading(false);
          return _context15.finish(48);
        case 51:
        case "end":
          return _context15.stop();
      }
    }, _callee15, null, [[2, 45, 48, 51]]);
  }));
  return _withdrawDeposit.apply(this, arguments);
}
function serializeBody(body) {
  return Buffer.from(JSON.stringify(body)).toString("base64");
}

// Helper to serialize auth info
function serializeAuthInfo(authInfo) {
  return Buffer.from(JSON.stringify(authInfo)).toString("base64");
}

// // Initialize Keplr chain configuration
function suggestChainLum() {
  return _suggestChainLum.apply(this, arguments);
}
function _suggestChainLum() {
  _suggestChainLum = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee16() {
    return _regeneratorRuntime().wrap(function _callee16$(_context16) {
      while (1) switch (_context16.prev = _context16.next) {
        case 0:
          if (window.keplr) {
            _context16.next = 2;
            break;
          }
          return _context16.abrupt("return");
        case 2:
          _context16.next = 4;
          return window.keplr.experimentalSuggestChain({
            chainId: CHAIN_ID,
            chainName: 'Lum Network',
            rpc: RPC_URL,
            rest: LCD_URL,
            bip44: {
              coinType: 118
            },
            bech32Config: {
              bech32PrefixAccAddr: "lum",
              bech32PrefixAccPub: "lum" + "pub",
              bech32PrefixValAddr: "lum" + "valoper",
              bech32PrefixValPub: "lum" + "valoperpub",
              bech32PrefixConsAddr: "lum" + "valcons",
              bech32PrefixConsPub: "lum" + "valconspub"
            },
            currencies: [{
              coinDenom: DENOM,
              coinMinimalDenom: DENOM,
              coinDecimals: 6
            }],
            feeCurrencies: [{
              coinDenom: DENOM,
              coinMinimalDenom: DENOM,
              coinDecimals: 6
            }],
            staking: {
              bondDenom: DENOM
            },
            validator: {
              pubKeyTypes: ['secp256k1']
            }
          });
        case 4:
        case "end":
          return _context16.stop();
      }
    }, _callee16);
  }));
  return _suggestChainLum.apply(this, arguments);
}

}).call(this)}).call(this,require("buffer").Buffer)

},{"big.js":2,"buffer":3}]},{},[5])(5)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYmFzZTY0LWpzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2JpZy5qcy9iaWcuanMiLCJub2RlX21vZHVsZXMvYnVmZmVyL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2llZWU3NTQvaW5kZXguanMiLCJzcmMvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDcmhDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDanZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7O0FDcEZBLElBQUEsSUFBQSxHQUFBLHNCQUFBLENBQUEsT0FBQTtBQUF5QixTQUFBLHVCQUFBLENBQUEsV0FBQSxDQUFBLElBQUEsQ0FBQSxDQUFBLFVBQUEsR0FBQSxDQUFBLGdCQUFBLENBQUE7QUFBQSxTQUFBLFFBQUEsQ0FBQSxFQUFBLENBQUEsUUFBQSxDQUFBLEdBQUEsTUFBQSxDQUFBLElBQUEsQ0FBQSxDQUFBLE9BQUEsTUFBQSxDQUFBLHFCQUFBLFFBQUEsQ0FBQSxHQUFBLE1BQUEsQ0FBQSxxQkFBQSxDQUFBLENBQUEsR0FBQSxDQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQSxNQUFBLFdBQUEsQ0FBQSxXQUFBLE1BQUEsQ0FBQSx3QkFBQSxDQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsVUFBQSxPQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsS0FBQSxDQUFBLENBQUEsRUFBQSxDQUFBLFlBQUEsQ0FBQTtBQUFBLFNBQUEsY0FBQSxDQUFBLGFBQUEsQ0FBQSxNQUFBLENBQUEsR0FBQSxTQUFBLENBQUEsTUFBQSxFQUFBLENBQUEsVUFBQSxDQUFBLFdBQUEsU0FBQSxDQUFBLENBQUEsSUFBQSxTQUFBLENBQUEsQ0FBQSxRQUFBLENBQUEsT0FBQSxPQUFBLENBQUEsTUFBQSxDQUFBLENBQUEsT0FBQSxPQUFBLFdBQUEsQ0FBQSxJQUFBLGVBQUEsQ0FBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUEsQ0FBQSxDQUFBLFNBQUEsTUFBQSxDQUFBLHlCQUFBLEdBQUEsTUFBQSxDQUFBLGdCQUFBLENBQUEsQ0FBQSxFQUFBLE1BQUEsQ0FBQSx5QkFBQSxDQUFBLENBQUEsS0FBQSxPQUFBLENBQUEsTUFBQSxDQUFBLENBQUEsR0FBQSxPQUFBLFdBQUEsQ0FBQSxJQUFBLE1BQUEsQ0FBQSxjQUFBLENBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxNQUFBLENBQUEsd0JBQUEsQ0FBQSxDQUFBLEVBQUEsQ0FBQSxpQkFBQSxDQUFBO0FBQUEsU0FBQSxnQkFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUEsWUFBQSxDQUFBLEdBQUEsY0FBQSxDQUFBLENBQUEsTUFBQSxDQUFBLEdBQUEsTUFBQSxDQUFBLGNBQUEsQ0FBQSxDQUFBLEVBQUEsQ0FBQSxJQUFBLEtBQUEsRUFBQSxDQUFBLEVBQUEsVUFBQSxNQUFBLFlBQUEsTUFBQSxRQUFBLFVBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLEVBQUEsQ0FBQTtBQUFBLFNBQUEsZUFBQSxDQUFBLFFBQUEsQ0FBQSxHQUFBLFlBQUEsQ0FBQSxDQUFBLGdDQUFBLE9BQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxHQUFBLENBQUE7QUFBQSxTQUFBLGFBQUEsQ0FBQSxFQUFBLENBQUEsb0JBQUEsT0FBQSxDQUFBLENBQUEsTUFBQSxDQUFBLFNBQUEsQ0FBQSxNQUFBLENBQUEsR0FBQSxDQUFBLENBQUEsTUFBQSxDQUFBLFdBQUEsa0JBQUEsQ0FBQSxRQUFBLENBQUEsR0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLENBQUEsRUFBQSxDQUFBLGdDQUFBLE9BQUEsQ0FBQSxDQUFBLFVBQUEsQ0FBQSxZQUFBLFNBQUEseUVBQUEsQ0FBQSxHQUFBLE1BQUEsR0FBQSxNQUFBLEVBQUEsQ0FBQTtBQUFBLFNBQUEsbUJBQUEsQ0FBQSxXQUFBLGtCQUFBLENBQUEsQ0FBQSxLQUFBLGdCQUFBLENBQUEsQ0FBQSxLQUFBLDJCQUFBLENBQUEsQ0FBQSxLQUFBLGtCQUFBO0FBQUEsU0FBQSxtQkFBQSxjQUFBLFNBQUE7QUFBQSxTQUFBLDRCQUFBLENBQUEsRUFBQSxDQUFBLFFBQUEsQ0FBQSwyQkFBQSxDQUFBLFNBQUEsaUJBQUEsQ0FBQSxDQUFBLEVBQUEsQ0FBQSxPQUFBLENBQUEsTUFBQSxRQUFBLENBQUEsSUFBQSxDQUFBLENBQUEsRUFBQSxLQUFBLDZCQUFBLENBQUEsSUFBQSxDQUFBLENBQUEsV0FBQSxLQUFBLENBQUEsR0FBQSxDQUFBLENBQUEsV0FBQSxDQUFBLElBQUEsYUFBQSxDQUFBLGNBQUEsQ0FBQSxHQUFBLEtBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQSxvQkFBQSxDQUFBLCtDQUFBLElBQUEsQ0FBQSxDQUFBLElBQUEsaUJBQUEsQ0FBQSxDQUFBLEVBQUEsQ0FBQTtBQUFBLFNBQUEsaUJBQUEsQ0FBQSw4QkFBQSxNQUFBLFlBQUEsQ0FBQSxDQUFBLE1BQUEsQ0FBQSxRQUFBLGFBQUEsQ0FBQSx1QkFBQSxLQUFBLENBQUEsSUFBQSxDQUFBLENBQUE7QUFBQSxTQUFBLG1CQUFBLENBQUEsUUFBQSxLQUFBLENBQUEsT0FBQSxDQUFBLENBQUEsVUFBQSxpQkFBQSxDQUFBLENBQUE7QUFBQSxTQUFBLGtCQUFBLENBQUEsRUFBQSxDQUFBLGFBQUEsQ0FBQSxJQUFBLENBQUEsR0FBQSxDQUFBLENBQUEsTUFBQSxNQUFBLENBQUEsR0FBQSxDQUFBLENBQUEsTUFBQSxZQUFBLENBQUEsTUFBQSxDQUFBLEdBQUEsS0FBQSxDQUFBLENBQUEsR0FBQSxDQUFBLEdBQUEsQ0FBQSxFQUFBLENBQUEsSUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQSxDQUFBLFVBQUEsQ0FBQTtBQUFBLFNBQUEsb0JBQUEsa0JBQXpCLHFKQUFBLG1CQUFBLFlBQUEsb0JBQUEsV0FBQSxDQUFBLFNBQUEsQ0FBQSxFQUFBLENBQUEsT0FBQSxDQUFBLEdBQUEsTUFBQSxDQUFBLFNBQUEsRUFBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBLGNBQUEsRUFBQSxDQUFBLEdBQUEsTUFBQSxDQUFBLGNBQUEsY0FBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUEsSUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQSxLQUFBLEtBQUEsQ0FBQSx3QkFBQSxNQUFBLEdBQUEsTUFBQSxPQUFBLENBQUEsR0FBQSxDQUFBLENBQUEsUUFBQSxrQkFBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBLGFBQUEsdUJBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQSxXQUFBLDhCQUFBLE9BQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxDQUFBLFdBQUEsTUFBQSxDQUFBLGNBQUEsQ0FBQSxDQUFBLEVBQUEsQ0FBQSxJQUFBLEtBQUEsRUFBQSxDQUFBLEVBQUEsVUFBQSxNQUFBLFlBQUEsTUFBQSxRQUFBLFNBQUEsQ0FBQSxDQUFBLENBQUEsV0FBQSxNQUFBLG1CQUFBLENBQUEsSUFBQSxNQUFBLFlBQUEsT0FBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUEsV0FBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsZ0JBQUEsS0FBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxDQUFBLFFBQUEsQ0FBQSxHQUFBLENBQUEsSUFBQSxDQUFBLENBQUEsU0FBQSxZQUFBLFNBQUEsR0FBQSxDQUFBLEdBQUEsU0FBQSxFQUFBLENBQUEsR0FBQSxNQUFBLENBQUEsTUFBQSxDQUFBLENBQUEsQ0FBQSxTQUFBLEdBQUEsQ0FBQSxPQUFBLE9BQUEsQ0FBQSxDQUFBLGdCQUFBLENBQUEsQ0FBQSxDQUFBLGVBQUEsS0FBQSxFQUFBLGdCQUFBLENBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxDQUFBLE1BQUEsQ0FBQSxhQUFBLFNBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxDQUFBLG1CQUFBLElBQUEsWUFBQSxHQUFBLEVBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxDQUFBLEVBQUEsQ0FBQSxjQUFBLENBQUEsYUFBQSxJQUFBLFdBQUEsR0FBQSxFQUFBLENBQUEsUUFBQSxDQUFBLENBQUEsSUFBQSxHQUFBLElBQUEsTUFBQSxDQUFBLHFCQUFBLENBQUEscUJBQUEsQ0FBQSxnQkFBQSxDQUFBLGdCQUFBLENBQUEsZ0JBQUEsVUFBQSxjQUFBLGtCQUFBLGNBQUEsMkJBQUEsU0FBQSxDQUFBLE9BQUEsTUFBQSxDQUFBLENBQUEsRUFBQSxDQUFBLHFDQUFBLENBQUEsR0FBQSxNQUFBLENBQUEsY0FBQSxFQUFBLENBQUEsR0FBQSxDQUFBLElBQUEsQ0FBQSxDQUFBLENBQUEsQ0FBQSxNQUFBLFFBQUEsQ0FBQSxJQUFBLENBQUEsS0FBQSxDQUFBLElBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxDQUFBLEVBQUEsQ0FBQSxNQUFBLENBQUEsR0FBQSxDQUFBLE9BQUEsQ0FBQSxHQUFBLDBCQUFBLENBQUEsU0FBQSxHQUFBLFNBQUEsQ0FBQSxTQUFBLEdBQUEsTUFBQSxDQUFBLE1BQUEsQ0FBQSxDQUFBLFlBQUEsc0JBQUEsQ0FBQSxnQ0FBQSxPQUFBLFdBQUEsQ0FBQSxJQUFBLE1BQUEsQ0FBQSxDQUFBLEVBQUEsQ0FBQSxZQUFBLENBQUEsZ0JBQUEsT0FBQSxDQUFBLENBQUEsRUFBQSxDQUFBLHNCQUFBLGNBQUEsQ0FBQSxFQUFBLENBQUEsYUFBQSxPQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUEsUUFBQSxDQUFBLEdBQUEsUUFBQSxDQUFBLENBQUEsQ0FBQSxDQUFBLEdBQUEsQ0FBQSxFQUFBLENBQUEsbUJBQUEsQ0FBQSxDQUFBLElBQUEsUUFBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBLEdBQUEsRUFBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBLEtBQUEsU0FBQSxDQUFBLGdCQUFBLE9BQUEsQ0FBQSxDQUFBLEtBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxDQUFBLGVBQUEsQ0FBQSxDQUFBLE9BQUEsQ0FBQSxDQUFBLENBQUEsT0FBQSxFQUFBLElBQUEsV0FBQSxDQUFBLElBQUEsTUFBQSxTQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxnQkFBQSxDQUFBLElBQUEsTUFBQSxVQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQSxPQUFBLENBQUEsQ0FBQSxFQUFBLElBQUEsV0FBQSxDQUFBLElBQUEsQ0FBQSxDQUFBLEtBQUEsR0FBQSxDQUFBLEVBQUEsQ0FBQSxDQUFBLENBQUEsZ0JBQUEsQ0FBQSxXQUFBLE1BQUEsVUFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUEsU0FBQSxDQUFBLENBQUEsQ0FBQSxDQUFBLEdBQUEsU0FBQSxDQUFBLEVBQUEsQ0FBQSxvQkFBQSxLQUFBLFdBQUEsTUFBQSxDQUFBLEVBQUEsQ0FBQSxhQUFBLDJCQUFBLGVBQUEsQ0FBQSxXQUFBLENBQUEsRUFBQSxDQUFBLElBQUEsTUFBQSxDQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUEsZ0JBQUEsQ0FBQSxHQUFBLENBQUEsR0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLDBCQUFBLEVBQUEsMEJBQUEsSUFBQSwwQkFBQSxxQkFBQSxpQkFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUEsUUFBQSxDQUFBLEdBQUEsQ0FBQSxtQkFBQSxDQUFBLEVBQUEsQ0FBQSxRQUFBLENBQUEsS0FBQSxDQUFBLFFBQUEsS0FBQSxzQ0FBQSxDQUFBLEtBQUEsQ0FBQSxvQkFBQSxDQUFBLFFBQUEsQ0FBQSxXQUFBLEtBQUEsRUFBQSxDQUFBLEVBQUEsSUFBQSxlQUFBLENBQUEsQ0FBQSxNQUFBLEdBQUEsQ0FBQSxFQUFBLENBQUEsQ0FBQSxHQUFBLEdBQUEsQ0FBQSxVQUFBLENBQUEsR0FBQSxDQUFBLENBQUEsUUFBQSxNQUFBLENBQUEsUUFBQSxDQUFBLEdBQUEsbUJBQUEsQ0FBQSxDQUFBLEVBQUEsQ0FBQSxPQUFBLENBQUEsUUFBQSxDQUFBLEtBQUEsQ0FBQSxtQkFBQSxDQUFBLHFCQUFBLENBQUEsQ0FBQSxNQUFBLEVBQUEsQ0FBQSxDQUFBLElBQUEsR0FBQSxDQUFBLENBQUEsS0FBQSxHQUFBLENBQUEsQ0FBQSxHQUFBLHNCQUFBLENBQUEsQ0FBQSxNQUFBLFFBQUEsQ0FBQSxLQUFBLENBQUEsUUFBQSxDQUFBLEdBQUEsQ0FBQSxFQUFBLENBQUEsQ0FBQSxHQUFBLEVBQUEsQ0FBQSxDQUFBLGlCQUFBLENBQUEsQ0FBQSxDQUFBLEdBQUEsdUJBQUEsQ0FBQSxDQUFBLE1BQUEsSUFBQSxDQUFBLENBQUEsTUFBQSxXQUFBLENBQUEsQ0FBQSxHQUFBLEdBQUEsQ0FBQSxHQUFBLENBQUEsTUFBQSxDQUFBLEdBQUEsUUFBQSxDQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxvQkFBQSxDQUFBLENBQUEsSUFBQSxRQUFBLENBQUEsR0FBQSxDQUFBLENBQUEsSUFBQSxHQUFBLENBQUEsR0FBQSxDQUFBLEVBQUEsQ0FBQSxDQUFBLEdBQUEsS0FBQSxDQUFBLHFCQUFBLEtBQUEsRUFBQSxDQUFBLENBQUEsR0FBQSxFQUFBLElBQUEsRUFBQSxDQUFBLENBQUEsSUFBQSxrQkFBQSxDQUFBLENBQUEsSUFBQSxLQUFBLENBQUEsR0FBQSxDQUFBLEVBQUEsQ0FBQSxDQUFBLE1BQUEsWUFBQSxDQUFBLENBQUEsR0FBQSxHQUFBLENBQUEsQ0FBQSxHQUFBLG1CQUFBLG9CQUFBLENBQUEsRUFBQSxDQUFBLFFBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQSxNQUFBLEVBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQSxPQUFBLENBQUEsS0FBQSxDQUFBLFNBQUEsQ0FBQSxDQUFBLFFBQUEscUJBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQSxRQUFBLGVBQUEsQ0FBQSxDQUFBLE1BQUEsYUFBQSxDQUFBLENBQUEsR0FBQSxHQUFBLENBQUEsRUFBQSxtQkFBQSxDQUFBLENBQUEsRUFBQSxDQUFBLGVBQUEsQ0FBQSxDQUFBLE1BQUEsa0JBQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQSxNQUFBLFlBQUEsQ0FBQSxDQUFBLEdBQUEsT0FBQSxTQUFBLHVDQUFBLENBQUEsaUJBQUEsQ0FBQSxNQUFBLENBQUEsR0FBQSxRQUFBLENBQUEsQ0FBQSxFQUFBLENBQUEsQ0FBQSxRQUFBLEVBQUEsQ0FBQSxDQUFBLEdBQUEsbUJBQUEsQ0FBQSxDQUFBLElBQUEsU0FBQSxDQUFBLENBQUEsTUFBQSxZQUFBLENBQUEsQ0FBQSxHQUFBLEdBQUEsQ0FBQSxDQUFBLEdBQUEsRUFBQSxDQUFBLENBQUEsUUFBQSxTQUFBLENBQUEsTUFBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBLEdBQUEsU0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBLElBQUEsSUFBQSxDQUFBLENBQUEsQ0FBQSxDQUFBLFVBQUEsSUFBQSxDQUFBLENBQUEsS0FBQSxFQUFBLENBQUEsQ0FBQSxJQUFBLEdBQUEsQ0FBQSxDQUFBLE9BQUEsZUFBQSxDQUFBLENBQUEsTUFBQSxLQUFBLENBQUEsQ0FBQSxNQUFBLFdBQUEsQ0FBQSxDQUFBLEdBQUEsR0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBLFFBQUEsU0FBQSxDQUFBLElBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQSxNQUFBLFlBQUEsQ0FBQSxDQUFBLEdBQUEsT0FBQSxTQUFBLHNDQUFBLENBQUEsQ0FBQSxRQUFBLFNBQUEsQ0FBQSxjQUFBLGFBQUEsQ0FBQSxRQUFBLENBQUEsS0FBQSxNQUFBLEVBQUEsQ0FBQSxZQUFBLENBQUEsS0FBQSxDQUFBLENBQUEsUUFBQSxHQUFBLENBQUEsV0FBQSxDQUFBLEtBQUEsQ0FBQSxDQUFBLFVBQUEsR0FBQSxDQUFBLEtBQUEsQ0FBQSxDQUFBLFFBQUEsR0FBQSxDQUFBLFdBQUEsVUFBQSxDQUFBLElBQUEsQ0FBQSxDQUFBLGNBQUEsY0FBQSxDQUFBLFFBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQSxVQUFBLFFBQUEsQ0FBQSxDQUFBLElBQUEsb0JBQUEsQ0FBQSxDQUFBLEdBQUEsRUFBQSxDQUFBLENBQUEsVUFBQSxHQUFBLENBQUEsYUFBQSxRQUFBLENBQUEsU0FBQSxVQUFBLE1BQUEsTUFBQSxhQUFBLENBQUEsQ0FBQSxPQUFBLENBQUEsWUFBQSxjQUFBLEtBQUEsaUJBQUEsT0FBQSxDQUFBLFFBQUEsQ0FBQSxXQUFBLENBQUEsUUFBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBLENBQUEsT0FBQSxDQUFBLFNBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxDQUFBLDRCQUFBLENBQUEsQ0FBQSxJQUFBLFNBQUEsQ0FBQSxPQUFBLEtBQUEsQ0FBQSxDQUFBLENBQUEsTUFBQSxTQUFBLENBQUEsT0FBQSxDQUFBLFlBQUEsS0FBQSxhQUFBLENBQUEsR0FBQSxDQUFBLENBQUEsTUFBQSxPQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQSxFQUFBLENBQUEsVUFBQSxJQUFBLENBQUEsS0FBQSxHQUFBLENBQUEsQ0FBQSxDQUFBLEdBQUEsSUFBQSxDQUFBLElBQUEsT0FBQSxJQUFBLFNBQUEsSUFBQSxDQUFBLEtBQUEsR0FBQSxDQUFBLEVBQUEsSUFBQSxDQUFBLElBQUEsT0FBQSxJQUFBLFlBQUEsQ0FBQSxDQUFBLElBQUEsR0FBQSxDQUFBLGdCQUFBLFNBQUEsQ0FBQSxPQUFBLENBQUEsQ0FBQSxrQ0FBQSxpQkFBQSxDQUFBLFNBQUEsR0FBQSwwQkFBQSxFQUFBLENBQUEsQ0FBQSxDQUFBLG1CQUFBLEtBQUEsRUFBQSwwQkFBQSxFQUFBLFlBQUEsU0FBQSxDQUFBLENBQUEsMEJBQUEsbUJBQUEsS0FBQSxFQUFBLGlCQUFBLEVBQUEsWUFBQSxTQUFBLGlCQUFBLENBQUEsV0FBQSxHQUFBLE1BQUEsQ0FBQSwwQkFBQSxFQUFBLENBQUEsd0JBQUEsQ0FBQSxDQUFBLG1CQUFBLGFBQUEsQ0FBQSxRQUFBLENBQUEsd0JBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQSxXQUFBLFdBQUEsQ0FBQSxLQUFBLENBQUEsS0FBQSxpQkFBQSw2QkFBQSxDQUFBLENBQUEsV0FBQSxJQUFBLENBQUEsQ0FBQSxJQUFBLE9BQUEsQ0FBQSxDQUFBLElBQUEsYUFBQSxDQUFBLFdBQUEsTUFBQSxDQUFBLGNBQUEsR0FBQSxNQUFBLENBQUEsY0FBQSxDQUFBLENBQUEsRUFBQSwwQkFBQSxLQUFBLENBQUEsQ0FBQSxTQUFBLEdBQUEsMEJBQUEsRUFBQSxNQUFBLENBQUEsQ0FBQSxFQUFBLENBQUEseUJBQUEsQ0FBQSxDQUFBLFNBQUEsR0FBQSxNQUFBLENBQUEsTUFBQSxDQUFBLENBQUEsR0FBQSxDQUFBLEtBQUEsQ0FBQSxDQUFBLEtBQUEsYUFBQSxDQUFBLGFBQUEsT0FBQSxFQUFBLENBQUEsT0FBQSxxQkFBQSxDQUFBLGFBQUEsQ0FBQSxTQUFBLEdBQUEsTUFBQSxDQUFBLGFBQUEsQ0FBQSxTQUFBLEVBQUEsQ0FBQSxpQ0FBQSxDQUFBLENBQUEsYUFBQSxHQUFBLGFBQUEsRUFBQSxDQUFBLENBQUEsS0FBQSxhQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxDQUFBLGVBQUEsQ0FBQSxLQUFBLENBQUEsR0FBQSxPQUFBLE9BQUEsQ0FBQSxPQUFBLGFBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxHQUFBLENBQUEsVUFBQSxDQUFBLENBQUEsbUJBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQSxJQUFBLEdBQUEsSUFBQSxXQUFBLENBQUEsV0FBQSxDQUFBLENBQUEsSUFBQSxHQUFBLENBQUEsQ0FBQSxLQUFBLEdBQUEsQ0FBQSxDQUFBLElBQUEsV0FBQSxxQkFBQSxDQUFBLENBQUEsR0FBQSxNQUFBLENBQUEsQ0FBQSxFQUFBLENBQUEsZ0JBQUEsTUFBQSxDQUFBLENBQUEsRUFBQSxDQUFBLGlDQUFBLE1BQUEsQ0FBQSxDQUFBLDZEQUFBLENBQUEsQ0FBQSxJQUFBLGFBQUEsQ0FBQSxRQUFBLENBQUEsR0FBQSxNQUFBLENBQUEsQ0FBQSxHQUFBLENBQUEsZ0JBQUEsQ0FBQSxJQUFBLENBQUEsRUFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLENBQUEsVUFBQSxDQUFBLENBQUEsT0FBQSxhQUFBLEtBQUEsV0FBQSxDQUFBLENBQUEsTUFBQSxTQUFBLENBQUEsR0FBQSxDQUFBLENBQUEsR0FBQSxRQUFBLENBQUEsSUFBQSxDQUFBLFNBQUEsSUFBQSxDQUFBLEtBQUEsR0FBQSxDQUFBLEVBQUEsSUFBQSxDQUFBLElBQUEsT0FBQSxJQUFBLFdBQUEsSUFBQSxDQUFBLElBQUEsT0FBQSxJQUFBLFFBQUEsQ0FBQSxDQUFBLE1BQUEsR0FBQSxNQUFBLEVBQUEsT0FBQSxDQUFBLFNBQUEsS0FBQSxXQUFBLEVBQUEsT0FBQSxFQUFBLEtBQUEsV0FBQSxNQUFBLENBQUEsYUFBQSxJQUFBLFdBQUEsSUFBQSxXQUFBLElBQUEsUUFBQSxLQUFBLEdBQUEsQ0FBQSxPQUFBLElBQUEsWUFBQSxRQUFBLGNBQUEsTUFBQSxnQkFBQSxHQUFBLEdBQUEsQ0FBQSxPQUFBLFVBQUEsQ0FBQSxPQUFBLENBQUEsYUFBQSxJQUFBLENBQUEsV0FBQSxDQUFBLGtCQUFBLENBQUEsQ0FBQSxNQUFBLE9BQUEsQ0FBQSxDQUFBLElBQUEsT0FBQSxDQUFBLE1BQUEsS0FBQSxFQUFBLENBQUEsQ0FBQSxLQUFBLGNBQUEsQ0FBQSxJQUFBLENBQUEsTUFBQSxJQUFBLFdBQUEsS0FBQSxTQUFBLElBQUEsV0FBQSxDQUFBLFFBQUEsVUFBQSxJQUFBLFVBQUEsa0JBQUEsQ0FBQSxDQUFBLElBQUEsUUFBQSxDQUFBLENBQUEsR0FBQSxjQUFBLElBQUEsS0FBQSxpQkFBQSxXQUFBLGtCQUFBLENBQUEsYUFBQSxJQUFBLFFBQUEsQ0FBQSxNQUFBLENBQUEsa0JBQUEsT0FBQSxDQUFBLEVBQUEsQ0FBQSxXQUFBLENBQUEsQ0FBQSxJQUFBLFlBQUEsQ0FBQSxDQUFBLEdBQUEsR0FBQSxDQUFBLEVBQUEsQ0FBQSxDQUFBLElBQUEsR0FBQSxDQUFBLEVBQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQSxNQUFBLFdBQUEsQ0FBQSxDQUFBLEdBQUEsR0FBQSxDQUFBLEtBQUEsQ0FBQSxhQUFBLENBQUEsUUFBQSxVQUFBLENBQUEsTUFBQSxNQUFBLENBQUEsU0FBQSxDQUFBLFFBQUEsQ0FBQSxRQUFBLFVBQUEsQ0FBQSxDQUFBLEdBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQSxVQUFBLGlCQUFBLENBQUEsQ0FBQSxNQUFBLFNBQUEsTUFBQSxhQUFBLENBQUEsQ0FBQSxNQUFBLFNBQUEsSUFBQSxRQUFBLENBQUEsR0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLENBQUEsZUFBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxDQUFBLHFCQUFBLENBQUEsSUFBQSxDQUFBLGFBQUEsSUFBQSxHQUFBLENBQUEsQ0FBQSxRQUFBLFNBQUEsTUFBQSxDQUFBLENBQUEsQ0FBQSxRQUFBLGdCQUFBLElBQUEsR0FBQSxDQUFBLENBQUEsVUFBQSxTQUFBLE1BQUEsQ0FBQSxDQUFBLENBQUEsVUFBQSxjQUFBLENBQUEsYUFBQSxJQUFBLEdBQUEsQ0FBQSxDQUFBLFFBQUEsU0FBQSxNQUFBLENBQUEsQ0FBQSxDQUFBLFFBQUEscUJBQUEsQ0FBQSxRQUFBLEtBQUEscURBQUEsSUFBQSxHQUFBLENBQUEsQ0FBQSxVQUFBLFNBQUEsTUFBQSxDQUFBLENBQUEsQ0FBQSxVQUFBLFlBQUEsTUFBQSxXQUFBLE9BQUEsQ0FBQSxFQUFBLENBQUEsYUFBQSxDQUFBLFFBQUEsVUFBQSxDQUFBLE1BQUEsTUFBQSxDQUFBLFNBQUEsQ0FBQSxRQUFBLENBQUEsUUFBQSxVQUFBLENBQUEsQ0FBQSxPQUFBLENBQUEsQ0FBQSxNQUFBLFNBQUEsSUFBQSxJQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQSx3QkFBQSxJQUFBLEdBQUEsQ0FBQSxDQUFBLFVBQUEsUUFBQSxDQUFBLEdBQUEsQ0FBQSxhQUFBLENBQUEsaUJBQUEsQ0FBQSxtQkFBQSxDQUFBLEtBQUEsQ0FBQSxDQUFBLE1BQUEsSUFBQSxDQUFBLElBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQSxVQUFBLEtBQUEsQ0FBQSxjQUFBLENBQUEsR0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBLFVBQUEsY0FBQSxDQUFBLENBQUEsSUFBQSxHQUFBLENBQUEsRUFBQSxDQUFBLENBQUEsR0FBQSxHQUFBLENBQUEsRUFBQSxDQUFBLFNBQUEsTUFBQSxnQkFBQSxJQUFBLEdBQUEsQ0FBQSxDQUFBLFVBQUEsRUFBQSxDQUFBLFNBQUEsUUFBQSxDQUFBLENBQUEsTUFBQSxRQUFBLFdBQUEsU0FBQSxDQUFBLEVBQUEsQ0FBQSxvQkFBQSxDQUFBLENBQUEsSUFBQSxRQUFBLENBQUEsQ0FBQSxHQUFBLHFCQUFBLENBQUEsQ0FBQSxJQUFBLG1CQUFBLENBQUEsQ0FBQSxJQUFBLFFBQUEsSUFBQSxHQUFBLENBQUEsQ0FBQSxHQUFBLGdCQUFBLENBQUEsQ0FBQSxJQUFBLFNBQUEsSUFBQSxRQUFBLEdBQUEsR0FBQSxDQUFBLENBQUEsR0FBQSxPQUFBLE1BQUEsa0JBQUEsSUFBQSx5QkFBQSxDQUFBLENBQUEsSUFBQSxJQUFBLENBQUEsVUFBQSxJQUFBLEdBQUEsQ0FBQSxHQUFBLENBQUEsS0FBQSxNQUFBLFdBQUEsT0FBQSxDQUFBLGFBQUEsQ0FBQSxRQUFBLFVBQUEsQ0FBQSxNQUFBLE1BQUEsQ0FBQSxTQUFBLENBQUEsUUFBQSxDQUFBLFFBQUEsVUFBQSxDQUFBLENBQUEsT0FBQSxDQUFBLENBQUEsVUFBQSxLQUFBLENBQUEsY0FBQSxRQUFBLENBQUEsQ0FBQSxDQUFBLFVBQUEsRUFBQSxDQUFBLENBQUEsUUFBQSxHQUFBLGFBQUEsQ0FBQSxDQUFBLEdBQUEsQ0FBQSx5QkFBQSxPQUFBLENBQUEsYUFBQSxDQUFBLFFBQUEsVUFBQSxDQUFBLE1BQUEsTUFBQSxDQUFBLFNBQUEsQ0FBQSxRQUFBLENBQUEsUUFBQSxVQUFBLENBQUEsQ0FBQSxPQUFBLENBQUEsQ0FBQSxNQUFBLEtBQUEsQ0FBQSxRQUFBLENBQUEsR0FBQSxDQUFBLENBQUEsVUFBQSxrQkFBQSxDQUFBLENBQUEsSUFBQSxRQUFBLENBQUEsR0FBQSxDQUFBLENBQUEsR0FBQSxFQUFBLGFBQUEsQ0FBQSxDQUFBLFlBQUEsQ0FBQSxZQUFBLEtBQUEsOEJBQUEsYUFBQSxXQUFBLGNBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxDQUFBLGdCQUFBLFFBQUEsS0FBQSxRQUFBLEVBQUEsTUFBQSxDQUFBLENBQUEsR0FBQSxVQUFBLEVBQUEsQ0FBQSxFQUFBLE9BQUEsRUFBQSxDQUFBLG9CQUFBLE1BQUEsVUFBQSxHQUFBLEdBQUEsQ0FBQSxHQUFBLENBQUEsT0FBQSxDQUFBO0FBQUEsU0FBQSxtQkFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEs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O0VBQUEsT0FBQSxnQkFBQSxDQUFBLEtBQUEsT0FBQSxTQUFBO0FBQUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIndXNlIHN0cmljdCdcblxuZXhwb3J0cy5ieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aFxuZXhwb3J0cy50b0J5dGVBcnJheSA9IHRvQnl0ZUFycmF5XG5leHBvcnRzLmZyb21CeXRlQXJyYXkgPSBmcm9tQnl0ZUFycmF5XG5cbnZhciBsb29rdXAgPSBbXVxudmFyIHJldkxvb2t1cCA9IFtdXG52YXIgQXJyID0gdHlwZW9mIFVpbnQ4QXJyYXkgIT09ICd1bmRlZmluZWQnID8gVWludDhBcnJheSA6IEFycmF5XG5cbnZhciBjb2RlID0gJ0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky8nXG5mb3IgKHZhciBpID0gMCwgbGVuID0gY29kZS5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICBsb29rdXBbaV0gPSBjb2RlW2ldXG4gIHJldkxvb2t1cFtjb2RlLmNoYXJDb2RlQXQoaSldID0gaVxufVxuXG4vLyBTdXBwb3J0IGRlY29kaW5nIFVSTC1zYWZlIGJhc2U2NCBzdHJpbmdzLCBhcyBOb2RlLmpzIGRvZXMuXG4vLyBTZWU6IGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0Jhc2U2NCNVUkxfYXBwbGljYXRpb25zXG5yZXZMb29rdXBbJy0nLmNoYXJDb2RlQXQoMCldID0gNjJcbnJldkxvb2t1cFsnXycuY2hhckNvZGVBdCgwKV0gPSA2M1xuXG5mdW5jdGlvbiBnZXRMZW5zIChiNjQpIHtcbiAgdmFyIGxlbiA9IGI2NC5sZW5ndGhcblxuICBpZiAobGVuICUgNCA+IDApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgc3RyaW5nLiBMZW5ndGggbXVzdCBiZSBhIG11bHRpcGxlIG9mIDQnKVxuICB9XG5cbiAgLy8gVHJpbSBvZmYgZXh0cmEgYnl0ZXMgYWZ0ZXIgcGxhY2Vob2xkZXIgYnl0ZXMgYXJlIGZvdW5kXG4gIC8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2JlYXRnYW1taXQvYmFzZTY0LWpzL2lzc3Vlcy80MlxuICB2YXIgdmFsaWRMZW4gPSBiNjQuaW5kZXhPZignPScpXG4gIGlmICh2YWxpZExlbiA9PT0gLTEpIHZhbGlkTGVuID0gbGVuXG5cbiAgdmFyIHBsYWNlSG9sZGVyc0xlbiA9IHZhbGlkTGVuID09PSBsZW5cbiAgICA/IDBcbiAgICA6IDQgLSAodmFsaWRMZW4gJSA0KVxuXG4gIHJldHVybiBbdmFsaWRMZW4sIHBsYWNlSG9sZGVyc0xlbl1cbn1cblxuLy8gYmFzZTY0IGlzIDQvMyArIHVwIHRvIHR3byBjaGFyYWN0ZXJzIG9mIHRoZSBvcmlnaW5hbCBkYXRhXG5mdW5jdGlvbiBieXRlTGVuZ3RoIChiNjQpIHtcbiAgdmFyIGxlbnMgPSBnZXRMZW5zKGI2NClcbiAgdmFyIHZhbGlkTGVuID0gbGVuc1swXVxuICB2YXIgcGxhY2VIb2xkZXJzTGVuID0gbGVuc1sxXVxuICByZXR1cm4gKCh2YWxpZExlbiArIHBsYWNlSG9sZGVyc0xlbikgKiAzIC8gNCkgLSBwbGFjZUhvbGRlcnNMZW5cbn1cblxuZnVuY3Rpb24gX2J5dGVMZW5ndGggKGI2NCwgdmFsaWRMZW4sIHBsYWNlSG9sZGVyc0xlbikge1xuICByZXR1cm4gKCh2YWxpZExlbiArIHBsYWNlSG9sZGVyc0xlbikgKiAzIC8gNCkgLSBwbGFjZUhvbGRlcnNMZW5cbn1cblxuZnVuY3Rpb24gdG9CeXRlQXJyYXkgKGI2NCkge1xuICB2YXIgdG1wXG4gIHZhciBsZW5zID0gZ2V0TGVucyhiNjQpXG4gIHZhciB2YWxpZExlbiA9IGxlbnNbMF1cbiAgdmFyIHBsYWNlSG9sZGVyc0xlbiA9IGxlbnNbMV1cblxuICB2YXIgYXJyID0gbmV3IEFycihfYnl0ZUxlbmd0aChiNjQsIHZhbGlkTGVuLCBwbGFjZUhvbGRlcnNMZW4pKVxuXG4gIHZhciBjdXJCeXRlID0gMFxuXG4gIC8vIGlmIHRoZXJlIGFyZSBwbGFjZWhvbGRlcnMsIG9ubHkgZ2V0IHVwIHRvIHRoZSBsYXN0IGNvbXBsZXRlIDQgY2hhcnNcbiAgdmFyIGxlbiA9IHBsYWNlSG9sZGVyc0xlbiA+IDBcbiAgICA/IHZhbGlkTGVuIC0gNFxuICAgIDogdmFsaWRMZW5cblxuICB2YXIgaVxuICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpICs9IDQpIHtcbiAgICB0bXAgPVxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpKV0gPDwgMTgpIHxcbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDEpXSA8PCAxMikgfFxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMildIDw8IDYpIHxcbiAgICAgIHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMyldXG4gICAgYXJyW2N1ckJ5dGUrK10gPSAodG1wID4+IDE2KSAmIDB4RkZcbiAgICBhcnJbY3VyQnl0ZSsrXSA9ICh0bXAgPj4gOCkgJiAweEZGXG4gICAgYXJyW2N1ckJ5dGUrK10gPSB0bXAgJiAweEZGXG4gIH1cblxuICBpZiAocGxhY2VIb2xkZXJzTGVuID09PSAyKSB7XG4gICAgdG1wID1cbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSldIDw8IDIpIHxcbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDEpXSA+PiA0KVxuICAgIGFycltjdXJCeXRlKytdID0gdG1wICYgMHhGRlxuICB9XG5cbiAgaWYgKHBsYWNlSG9sZGVyc0xlbiA9PT0gMSkge1xuICAgIHRtcCA9XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkpXSA8PCAxMCkgfFxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMSldIDw8IDQpIHxcbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDIpXSA+PiAyKVxuICAgIGFycltjdXJCeXRlKytdID0gKHRtcCA+PiA4KSAmIDB4RkZcbiAgICBhcnJbY3VyQnl0ZSsrXSA9IHRtcCAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBhcnJcbn1cblxuZnVuY3Rpb24gdHJpcGxldFRvQmFzZTY0IChudW0pIHtcbiAgcmV0dXJuIGxvb2t1cFtudW0gPj4gMTggJiAweDNGXSArXG4gICAgbG9va3VwW251bSA+PiAxMiAmIDB4M0ZdICtcbiAgICBsb29rdXBbbnVtID4+IDYgJiAweDNGXSArXG4gICAgbG9va3VwW251bSAmIDB4M0ZdXG59XG5cbmZ1bmN0aW9uIGVuY29kZUNodW5rICh1aW50OCwgc3RhcnQsIGVuZCkge1xuICB2YXIgdG1wXG4gIHZhciBvdXRwdXQgPSBbXVxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkgKz0gMykge1xuICAgIHRtcCA9XG4gICAgICAoKHVpbnQ4W2ldIDw8IDE2KSAmIDB4RkYwMDAwKSArXG4gICAgICAoKHVpbnQ4W2kgKyAxXSA8PCA4KSAmIDB4RkYwMCkgK1xuICAgICAgKHVpbnQ4W2kgKyAyXSAmIDB4RkYpXG4gICAgb3V0cHV0LnB1c2godHJpcGxldFRvQmFzZTY0KHRtcCkpXG4gIH1cbiAgcmV0dXJuIG91dHB1dC5qb2luKCcnKVxufVxuXG5mdW5jdGlvbiBmcm9tQnl0ZUFycmF5ICh1aW50OCkge1xuICB2YXIgdG1wXG4gIHZhciBsZW4gPSB1aW50OC5sZW5ndGhcbiAgdmFyIGV4dHJhQnl0ZXMgPSBsZW4gJSAzIC8vIGlmIHdlIGhhdmUgMSBieXRlIGxlZnQsIHBhZCAyIGJ5dGVzXG4gIHZhciBwYXJ0cyA9IFtdXG4gIHZhciBtYXhDaHVua0xlbmd0aCA9IDE2MzgzIC8vIG11c3QgYmUgbXVsdGlwbGUgb2YgM1xuXG4gIC8vIGdvIHRocm91Z2ggdGhlIGFycmF5IGV2ZXJ5IHRocmVlIGJ5dGVzLCB3ZSdsbCBkZWFsIHdpdGggdHJhaWxpbmcgc3R1ZmYgbGF0ZXJcbiAgZm9yICh2YXIgaSA9IDAsIGxlbjIgPSBsZW4gLSBleHRyYUJ5dGVzOyBpIDwgbGVuMjsgaSArPSBtYXhDaHVua0xlbmd0aCkge1xuICAgIHBhcnRzLnB1c2goZW5jb2RlQ2h1bmsodWludDgsIGksIChpICsgbWF4Q2h1bmtMZW5ndGgpID4gbGVuMiA/IGxlbjIgOiAoaSArIG1heENodW5rTGVuZ3RoKSkpXG4gIH1cblxuICAvLyBwYWQgdGhlIGVuZCB3aXRoIHplcm9zLCBidXQgbWFrZSBzdXJlIHRvIG5vdCBmb3JnZXQgdGhlIGV4dHJhIGJ5dGVzXG4gIGlmIChleHRyYUJ5dGVzID09PSAxKSB7XG4gICAgdG1wID0gdWludDhbbGVuIC0gMV1cbiAgICBwYXJ0cy5wdXNoKFxuICAgICAgbG9va3VwW3RtcCA+PiAyXSArXG4gICAgICBsb29rdXBbKHRtcCA8PCA0KSAmIDB4M0ZdICtcbiAgICAgICc9PSdcbiAgICApXG4gIH0gZWxzZSBpZiAoZXh0cmFCeXRlcyA9PT0gMikge1xuICAgIHRtcCA9ICh1aW50OFtsZW4gLSAyXSA8PCA4KSArIHVpbnQ4W2xlbiAtIDFdXG4gICAgcGFydHMucHVzaChcbiAgICAgIGxvb2t1cFt0bXAgPj4gMTBdICtcbiAgICAgIGxvb2t1cFsodG1wID4+IDQpICYgMHgzRl0gK1xuICAgICAgbG9va3VwWyh0bXAgPDwgMikgJiAweDNGXSArXG4gICAgICAnPSdcbiAgICApXG4gIH1cblxuICByZXR1cm4gcGFydHMuam9pbignJylcbn1cbiIsIi8qXHJcbiAqICBiaWcuanMgdjcuMC4wXHJcbiAqICBBIHNtYWxsLCBmYXN0LCBlYXN5LXRvLXVzZSBsaWJyYXJ5IGZvciBhcmJpdHJhcnktcHJlY2lzaW9uIGRlY2ltYWwgYXJpdGhtZXRpYy5cclxuICogIENvcHlyaWdodCAoYykgMjAyNSBNaWNoYWVsIE1jbGF1Z2hsaW5cclxuICogIGh0dHBzOi8vZ2l0aHViLmNvbS9NaWtlTWNsL2JpZy5qcy9MSUNFTkNFLm1kXHJcbiAqL1xyXG47KGZ1bmN0aW9uIChHTE9CQUwpIHtcclxuICAndXNlIHN0cmljdCc7XHJcbiAgdmFyIEJpZyxcclxuXHJcblxyXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogRURJVEFCTEUgREVGQVVMVFMgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXHJcblxyXG5cclxuICAgIC8vIFRoZSBkZWZhdWx0IHZhbHVlcyBiZWxvdyBtdXN0IGJlIGludGVnZXJzIHdpdGhpbiB0aGUgc3RhdGVkIHJhbmdlcy5cclxuXHJcbiAgICAvKlxyXG4gICAgICogVGhlIG1heGltdW0gbnVtYmVyIG9mIGRlY2ltYWwgcGxhY2VzIChEUCkgb2YgdGhlIHJlc3VsdHMgb2Ygb3BlcmF0aW9ucyBpbnZvbHZpbmcgZGl2aXNpb246XHJcbiAgICAgKiBkaXYgYW5kIHNxcnQsIGFuZCBwb3cgd2l0aCBuZWdhdGl2ZSBleHBvbmVudHMuXHJcbiAgICAgKi9cclxuICAgIERQID0gMjAsICAgICAgICAgICAgLy8gMCB0byBNQVhfRFBcclxuXHJcbiAgICAvKlxyXG4gICAgICogVGhlIHJvdW5kaW5nIG1vZGUgKFJNKSB1c2VkIHdoZW4gcm91bmRpbmcgdG8gdGhlIGFib3ZlIGRlY2ltYWwgcGxhY2VzLlxyXG4gICAgICpcclxuICAgICAqICAwICBUb3dhcmRzIHplcm8gKGkuZS4gdHJ1bmNhdGUsIG5vIHJvdW5kaW5nKS4gICAgICAgKFJPVU5EX0RPV04pXHJcbiAgICAgKiAgMSAgVG8gbmVhcmVzdCBuZWlnaGJvdXIuIElmIGVxdWlkaXN0YW50LCByb3VuZCB1cC4gIChST1VORF9IQUxGX1VQKVxyXG4gICAgICogIDIgIFRvIG5lYXJlc3QgbmVpZ2hib3VyLiBJZiBlcXVpZGlzdGFudCwgdG8gZXZlbi4gICAoUk9VTkRfSEFMRl9FVkVOKVxyXG4gICAgICogIDMgIEF3YXkgZnJvbSB6ZXJvLiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoUk9VTkRfVVApXHJcbiAgICAgKi9cclxuICAgIFJNID0gMSwgICAgICAgICAgICAgLy8gMCwgMSwgMiBvciAzXHJcblxyXG4gICAgLy8gVGhlIG1heGltdW0gdmFsdWUgb2YgRFAgYW5kIEJpZy5EUC5cclxuICAgIE1BWF9EUCA9IDFFNiwgICAgICAgLy8gMCB0byAxMDAwMDAwXHJcblxyXG4gICAgLy8gVGhlIG1heGltdW0gbWFnbml0dWRlIG9mIHRoZSBleHBvbmVudCBhcmd1bWVudCB0byB0aGUgcG93IG1ldGhvZC5cclxuICAgIE1BWF9QT1dFUiA9IDFFNiwgICAgLy8gMSB0byAxMDAwMDAwXHJcblxyXG4gICAgLypcclxuICAgICAqIFRoZSBuZWdhdGl2ZSBleHBvbmVudCAoTkUpIGF0IGFuZCBiZW5lYXRoIHdoaWNoIHRvU3RyaW5nIHJldHVybnMgZXhwb25lbnRpYWwgbm90YXRpb24uXHJcbiAgICAgKiAoSmF2YVNjcmlwdCBudW1iZXJzOiAtNylcclxuICAgICAqIC0xMDAwMDAwIGlzIHRoZSBtaW5pbXVtIHJlY29tbWVuZGVkIGV4cG9uZW50IHZhbHVlIG9mIGEgQmlnLlxyXG4gICAgICovXHJcbiAgICBORSA9IC03LCAgICAgICAgICAgIC8vIDAgdG8gLTEwMDAwMDBcclxuXHJcbiAgICAvKlxyXG4gICAgICogVGhlIHBvc2l0aXZlIGV4cG9uZW50IChQRSkgYXQgYW5kIGFib3ZlIHdoaWNoIHRvU3RyaW5nIHJldHVybnMgZXhwb25lbnRpYWwgbm90YXRpb24uXHJcbiAgICAgKiAoSmF2YVNjcmlwdCBudW1iZXJzOiAyMSlcclxuICAgICAqIDEwMDAwMDAgaXMgdGhlIG1heGltdW0gcmVjb21tZW5kZWQgZXhwb25lbnQgdmFsdWUgb2YgYSBCaWcsIGJ1dCB0aGlzIGxpbWl0IGlzIG5vdCBlbmZvcmNlZC5cclxuICAgICAqL1xyXG4gICAgUEUgPSAyMSwgICAgICAgICAgICAvLyAwIHRvIDEwMDAwMDBcclxuXHJcbiAgICAvKlxyXG4gICAgICogV2hlbiB0cnVlLCBhbiBlcnJvciB3aWxsIGJlIHRocm93biBpZiBhIHByaW1pdGl2ZSBudW1iZXIgaXMgcGFzc2VkIHRvIHRoZSBCaWcgY29uc3RydWN0b3IsXHJcbiAgICAgKiBvciBpZiB2YWx1ZU9mIGlzIGNhbGxlZCwgb3IgaWYgdG9OdW1iZXIgaXMgY2FsbGVkIG9uIGEgQmlnIHdoaWNoIGNhbm5vdCBiZSBjb252ZXJ0ZWQgdG8gYVxyXG4gICAgICogcHJpbWl0aXZlIG51bWJlciB3aXRob3V0IGEgbG9zcyBvZiBwcmVjaXNpb24uXHJcbiAgICAgKi9cclxuICAgIFNUUklDVCA9IGZhbHNlLCAgICAgLy8gdHJ1ZSBvciBmYWxzZVxyXG5cclxuXHJcbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cclxuXHJcblxyXG4gICAgLy8gRXJyb3IgbWVzc2FnZXMuXHJcbiAgICBOQU1FID0gJ1tiaWcuanNdICcsXHJcbiAgICBJTlZBTElEID0gTkFNRSArICdJbnZhbGlkICcsXHJcbiAgICBJTlZBTElEX0RQID0gSU5WQUxJRCArICdkZWNpbWFsIHBsYWNlcycsXHJcbiAgICBJTlZBTElEX1JNID0gSU5WQUxJRCArICdyb3VuZGluZyBtb2RlJyxcclxuICAgIERJVl9CWV9aRVJPID0gTkFNRSArICdEaXZpc2lvbiBieSB6ZXJvJyxcclxuXHJcbiAgICAvLyBUaGUgc2hhcmVkIHByb3RvdHlwZSBvYmplY3QuXHJcbiAgICBQID0ge30sXHJcbiAgICBVTkRFRklORUQgPSB2b2lkIDAsXHJcbiAgICBOVU1FUklDID0gL14tPyhcXGQrKFxcLlxcZCopP3xcXC5cXGQrKShlWystXT9cXGQrKT8kL2k7XHJcblxyXG5cclxuICAvKlxyXG4gICAqIENyZWF0ZSBhbmQgcmV0dXJuIGEgQmlnIGNvbnN0cnVjdG9yLlxyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIF9CaWdfKCkge1xyXG5cclxuICAgIC8qXHJcbiAgICAgKiBUaGUgQmlnIGNvbnN0cnVjdG9yIGFuZCBleHBvcnRlZCBmdW5jdGlvbi5cclxuICAgICAqIENyZWF0ZSBhbmQgcmV0dXJuIGEgbmV3IGluc3RhbmNlIG9mIGEgQmlnIG51bWJlciBvYmplY3QuXHJcbiAgICAgKlxyXG4gICAgICogbiB7bnVtYmVyfHN0cmluZ3xCaWd9IEEgbnVtZXJpYyB2YWx1ZS5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gQmlnKG4pIHtcclxuICAgICAgdmFyIHggPSB0aGlzO1xyXG5cclxuICAgICAgLy8gRW5hYmxlIGNvbnN0cnVjdG9yIHVzYWdlIHdpdGhvdXQgbmV3LlxyXG4gICAgICBpZiAoISh4IGluc3RhbmNlb2YgQmlnKSkge1xyXG4gICAgICAgIHJldHVybiBuID09PSBVTkRFRklORUQgJiYgYXJndW1lbnRzLmxlbmd0aCA9PT0gMCA/IF9CaWdfKCkgOiBuZXcgQmlnKG4pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBEdXBsaWNhdGUuXHJcbiAgICAgIGlmIChuIGluc3RhbmNlb2YgQmlnKSB7XHJcbiAgICAgICAgeC5zID0gbi5zO1xyXG4gICAgICAgIHguZSA9IG4uZTtcclxuICAgICAgICB4LmMgPSBuLmMuc2xpY2UoKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBpZiAodHlwZW9mIG4gIT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICBpZiAoQmlnLnN0cmljdCA9PT0gdHJ1ZSAmJiB0eXBlb2YgbiAhPT0gJ2JpZ2ludCcpIHtcclxuICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKElOVkFMSUQgKyAndmFsdWUnKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBNaW51cyB6ZXJvP1xyXG4gICAgICAgICAgbiA9IG4gPT09IDAgJiYgMSAvIG4gPCAwID8gJy0wJyA6IFN0cmluZyhuKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHBhcnNlKHgsIG4pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBSZXRhaW4gYSByZWZlcmVuY2UgdG8gdGhpcyBCaWcgY29uc3RydWN0b3IuXHJcbiAgICAgIC8vIFNoYWRvdyBCaWcucHJvdG90eXBlLmNvbnN0cnVjdG9yIHdoaWNoIHBvaW50cyB0byBPYmplY3QuXHJcbiAgICAgIHguY29uc3RydWN0b3IgPSBCaWc7XHJcbiAgICB9XHJcblxyXG4gICAgQmlnLnByb3RvdHlwZSA9IFA7XHJcbiAgICBCaWcuRFAgPSBEUDtcclxuICAgIEJpZy5STSA9IFJNO1xyXG4gICAgQmlnLk5FID0gTkU7XHJcbiAgICBCaWcuUEUgPSBQRTtcclxuICAgIEJpZy5zdHJpY3QgPSBTVFJJQ1Q7XHJcbiAgICBCaWcucm91bmREb3duID0gMDtcclxuICAgIEJpZy5yb3VuZEhhbGZVcCA9IDE7XHJcbiAgICBCaWcucm91bmRIYWxmRXZlbiA9IDI7XHJcbiAgICBCaWcucm91bmRVcCA9IDM7XHJcblxyXG4gICAgcmV0dXJuIEJpZztcclxuICB9XHJcblxyXG5cclxuICAvKlxyXG4gICAqIFBhcnNlIHRoZSBudW1iZXIgb3Igc3RyaW5nIHZhbHVlIHBhc3NlZCB0byBhIEJpZyBjb25zdHJ1Y3Rvci5cclxuICAgKlxyXG4gICAqIHgge0JpZ30gQSBCaWcgbnVtYmVyIGluc3RhbmNlLlxyXG4gICAqIG4ge251bWJlcnxzdHJpbmd9IEEgbnVtZXJpYyB2YWx1ZS5cclxuICAgKi9cclxuICBmdW5jdGlvbiBwYXJzZSh4LCBuKSB7XHJcbiAgICB2YXIgZSwgaSwgbmw7XHJcblxyXG4gICAgaWYgKCFOVU1FUklDLnRlc3QobikpIHtcclxuICAgICAgdGhyb3cgRXJyb3IoSU5WQUxJRCArICdudW1iZXInKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBEZXRlcm1pbmUgc2lnbi5cclxuICAgIHgucyA9IG4uY2hhckF0KDApID09ICctJyA/IChuID0gbi5zbGljZSgxKSwgLTEpIDogMTtcclxuXHJcbiAgICAvLyBEZWNpbWFsIHBvaW50P1xyXG4gICAgaWYgKChlID0gbi5pbmRleE9mKCcuJykpID4gLTEpIG4gPSBuLnJlcGxhY2UoJy4nLCAnJyk7XHJcblxyXG4gICAgLy8gRXhwb25lbnRpYWwgZm9ybT9cclxuICAgIGlmICgoaSA9IG4uc2VhcmNoKC9lL2kpKSA+IDApIHtcclxuXHJcbiAgICAgIC8vIERldGVybWluZSBleHBvbmVudC5cclxuICAgICAgaWYgKGUgPCAwKSBlID0gaTtcclxuICAgICAgZSArPSArbi5zbGljZShpICsgMSk7XHJcbiAgICAgIG4gPSBuLnN1YnN0cmluZygwLCBpKTtcclxuICAgIH0gZWxzZSBpZiAoZSA8IDApIHtcclxuXHJcbiAgICAgIC8vIEludGVnZXIuXHJcbiAgICAgIGUgPSBuLmxlbmd0aDtcclxuICAgIH1cclxuXHJcbiAgICBubCA9IG4ubGVuZ3RoO1xyXG5cclxuICAgIC8vIERldGVybWluZSBsZWFkaW5nIHplcm9zLlxyXG4gICAgZm9yIChpID0gMDsgaSA8IG5sICYmIG4uY2hhckF0KGkpID09ICcwJzspICsraTtcclxuXHJcbiAgICBpZiAoaSA9PSBubCkge1xyXG5cclxuICAgICAgLy8gWmVyby5cclxuICAgICAgeC5jID0gW3guZSA9IDBdO1xyXG4gICAgfSBlbHNlIHtcclxuXHJcbiAgICAgIC8vIERldGVybWluZSB0cmFpbGluZyB6ZXJvcy5cclxuICAgICAgZm9yICg7IG5sID4gMCAmJiBuLmNoYXJBdCgtLW5sKSA9PSAnMCc7KTtcclxuICAgICAgeC5lID0gZSAtIGkgLSAxO1xyXG4gICAgICB4LmMgPSBbXTtcclxuXHJcbiAgICAgIC8vIENvbnZlcnQgc3RyaW5nIHRvIGFycmF5IG9mIGRpZ2l0cyB3aXRob3V0IGxlYWRpbmcvdHJhaWxpbmcgemVyb3MuXHJcbiAgICAgIGZvciAoZSA9IDA7IGkgPD0gbmw7KSB4LmNbZSsrXSA9ICtuLmNoYXJBdChpKyspO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB4O1xyXG4gIH1cclxuXHJcblxyXG4gIC8qXHJcbiAgICogUm91bmQgQmlnIHggdG8gYSBtYXhpbXVtIG9mIHNkIHNpZ25pZmljYW50IGRpZ2l0cyB1c2luZyByb3VuZGluZyBtb2RlIHJtLlxyXG4gICAqXHJcbiAgICogeCB7QmlnfSBUaGUgQmlnIHRvIHJvdW5kLlxyXG4gICAqIHNkIHtudW1iZXJ9IFNpZ25pZmljYW50IGRpZ2l0czogaW50ZWdlciwgMCB0byBNQVhfRFAgaW5jbHVzaXZlLlxyXG4gICAqIHJtIHtudW1iZXJ9IFJvdW5kaW5nIG1vZGU6IDAgKGRvd24pLCAxIChoYWxmLXVwKSwgMiAoaGFsZi1ldmVuKSBvciAzICh1cCkuXHJcbiAgICogW21vcmVdIHtib29sZWFufSBXaGV0aGVyIHRoZSByZXN1bHQgb2YgZGl2aXNpb24gd2FzIHRydW5jYXRlZC5cclxuICAgKi9cclxuICBmdW5jdGlvbiByb3VuZCh4LCBzZCwgcm0sIG1vcmUpIHtcclxuICAgIHZhciB4YyA9IHguYztcclxuXHJcbiAgICBpZiAocm0gPT09IFVOREVGSU5FRCkgcm0gPSB4LmNvbnN0cnVjdG9yLlJNO1xyXG4gICAgaWYgKHJtICE9PSAwICYmIHJtICE9PSAxICYmIHJtICE9PSAyICYmIHJtICE9PSAzKSB7XHJcbiAgICAgIHRocm93IEVycm9yKElOVkFMSURfUk0pO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChzZCA8IDEpIHtcclxuICAgICAgbW9yZSA9XHJcbiAgICAgICAgcm0gPT09IDMgJiYgKG1vcmUgfHwgISF4Y1swXSkgfHwgc2QgPT09IDAgJiYgKFxyXG4gICAgICAgIHJtID09PSAxICYmIHhjWzBdID49IDUgfHxcclxuICAgICAgICBybSA9PT0gMiAmJiAoeGNbMF0gPiA1IHx8IHhjWzBdID09PSA1ICYmIChtb3JlIHx8IHhjWzFdICE9PSBVTkRFRklORUQpKVxyXG4gICAgICApO1xyXG5cclxuICAgICAgeGMubGVuZ3RoID0gMTtcclxuXHJcbiAgICAgIGlmIChtb3JlKSB7XHJcblxyXG4gICAgICAgIC8vIDEsIDAuMSwgMC4wMSwgMC4wMDEsIDAuMDAwMSBldGMuXHJcbiAgICAgICAgeC5lID0geC5lIC0gc2QgKyAxO1xyXG4gICAgICAgIHhjWzBdID0gMTtcclxuICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgLy8gWmVyby5cclxuICAgICAgICB4Y1swXSA9IHguZSA9IDA7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSBpZiAoc2QgPCB4Yy5sZW5ndGgpIHtcclxuXHJcbiAgICAgIC8vIHhjW3NkXSBpcyB0aGUgZGlnaXQgYWZ0ZXIgdGhlIGRpZ2l0IHRoYXQgbWF5IGJlIHJvdW5kZWQgdXAuXHJcbiAgICAgIG1vcmUgPVxyXG4gICAgICAgIHJtID09PSAxICYmIHhjW3NkXSA+PSA1IHx8XHJcbiAgICAgICAgcm0gPT09IDIgJiYgKHhjW3NkXSA+IDUgfHwgeGNbc2RdID09PSA1ICYmXHJcbiAgICAgICAgICAobW9yZSB8fCB4Y1tzZCArIDFdICE9PSBVTkRFRklORUQgfHwgeGNbc2QgLSAxXSAmIDEpKSB8fFxyXG4gICAgICAgIHJtID09PSAzICYmIChtb3JlIHx8ICEheGNbMF0pO1xyXG5cclxuICAgICAgLy8gUmVtb3ZlIGFueSBkaWdpdHMgYWZ0ZXIgdGhlIHJlcXVpcmVkIHByZWNpc2lvbi5cclxuICAgICAgeGMubGVuZ3RoID0gc2Q7XHJcblxyXG4gICAgICAvLyBSb3VuZCB1cD9cclxuICAgICAgaWYgKG1vcmUpIHtcclxuXHJcbiAgICAgICAgLy8gUm91bmRpbmcgdXAgbWF5IG1lYW4gdGhlIHByZXZpb3VzIGRpZ2l0IGhhcyB0byBiZSByb3VuZGVkIHVwLlxyXG4gICAgICAgIGZvciAoOyArK3hjWy0tc2RdID4gOTspIHtcclxuICAgICAgICAgIHhjW3NkXSA9IDA7XHJcbiAgICAgICAgICBpZiAoc2QgPT09IDApIHtcclxuICAgICAgICAgICAgKyt4LmU7XHJcbiAgICAgICAgICAgIHhjLnVuc2hpZnQoMSk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gUmVtb3ZlIHRyYWlsaW5nIHplcm9zLlxyXG4gICAgICBmb3IgKHNkID0geGMubGVuZ3RoOyAheGNbLS1zZF07KSB4Yy5wb3AoKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4geDtcclxuICB9XHJcblxyXG5cclxuICAvKlxyXG4gICAqIFJldHVybiBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHZhbHVlIG9mIEJpZyB4IGluIG5vcm1hbCBvciBleHBvbmVudGlhbCBub3RhdGlvbi5cclxuICAgKiBIYW5kbGVzIFAudG9FeHBvbmVudGlhbCwgUC50b0ZpeGVkLCBQLnRvSlNPTiwgUC50b1ByZWNpc2lvbiwgUC50b1N0cmluZyBhbmQgUC52YWx1ZU9mLlxyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIHN0cmluZ2lmeSh4LCBkb0V4cG9uZW50aWFsLCBpc05vbnplcm8pIHtcclxuICAgIHZhciBlID0geC5lLFxyXG4gICAgICBzID0geC5jLmpvaW4oJycpLFxyXG4gICAgICBuID0gcy5sZW5ndGg7XHJcblxyXG4gICAgLy8gRXhwb25lbnRpYWwgbm90YXRpb24/XHJcbiAgICBpZiAoZG9FeHBvbmVudGlhbCkge1xyXG4gICAgICBzID0gcy5jaGFyQXQoMCkgKyAobiA+IDEgPyAnLicgKyBzLnNsaWNlKDEpIDogJycpICsgKGUgPCAwID8gJ2UnIDogJ2UrJykgKyBlO1xyXG5cclxuICAgIC8vIE5vcm1hbCBub3RhdGlvbi5cclxuICAgIH0gZWxzZSBpZiAoZSA8IDApIHtcclxuICAgICAgZm9yICg7ICsrZTspIHMgPSAnMCcgKyBzO1xyXG4gICAgICBzID0gJzAuJyArIHM7XHJcbiAgICB9IGVsc2UgaWYgKGUgPiAwKSB7XHJcbiAgICAgIGlmICgrK2UgPiBuKSB7XHJcbiAgICAgICAgZm9yIChlIC09IG47IGUtLTspIHMgKz0gJzAnO1xyXG4gICAgICB9IGVsc2UgaWYgKGUgPCBuKSB7XHJcbiAgICAgICAgcyA9IHMuc2xpY2UoMCwgZSkgKyAnLicgKyBzLnNsaWNlKGUpO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2UgaWYgKG4gPiAxKSB7XHJcbiAgICAgIHMgPSBzLmNoYXJBdCgwKSArICcuJyArIHMuc2xpY2UoMSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHgucyA8IDAgJiYgaXNOb256ZXJvID8gJy0nICsgcyA6IHM7XHJcbiAgfVxyXG5cclxuXHJcbiAgLy8gUHJvdG90eXBlL2luc3RhbmNlIG1ldGhvZHNcclxuXHJcblxyXG4gIC8qXHJcbiAgICogUmV0dXJuIGEgbmV3IEJpZyB3aG9zZSB2YWx1ZSBpcyB0aGUgYWJzb2x1dGUgdmFsdWUgb2YgdGhpcyBCaWcuXHJcbiAgICovXHJcbiAgUC5hYnMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgeCA9IG5ldyB0aGlzLmNvbnN0cnVjdG9yKHRoaXMpO1xyXG4gICAgeC5zID0gMTtcclxuICAgIHJldHVybiB4O1xyXG4gIH07XHJcblxyXG5cclxuICAvKlxyXG4gICAqIFJldHVybiAxIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZyBpcyBncmVhdGVyIHRoYW4gdGhlIHZhbHVlIG9mIEJpZyB5LFxyXG4gICAqICAgICAgIC0xIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZyBpcyBsZXNzIHRoYW4gdGhlIHZhbHVlIG9mIEJpZyB5LCBvclxyXG4gICAqICAgICAgICAwIGlmIHRoZXkgaGF2ZSB0aGUgc2FtZSB2YWx1ZS5cclxuICAgKi9cclxuICBQLmNtcCA9IGZ1bmN0aW9uICh5KSB7XHJcbiAgICB2YXIgaXNuZWcsXHJcbiAgICAgIHggPSB0aGlzLFxyXG4gICAgICB4YyA9IHguYyxcclxuICAgICAgeWMgPSAoeSA9IG5ldyB4LmNvbnN0cnVjdG9yKHkpKS5jLFxyXG4gICAgICBpID0geC5zLFxyXG4gICAgICBqID0geS5zLFxyXG4gICAgICBrID0geC5lLFxyXG4gICAgICBsID0geS5lO1xyXG5cclxuICAgIC8vIEVpdGhlciB6ZXJvP1xyXG4gICAgaWYgKCF4Y1swXSB8fCAheWNbMF0pIHJldHVybiAheGNbMF0gPyAheWNbMF0gPyAwIDogLWogOiBpO1xyXG5cclxuICAgIC8vIFNpZ25zIGRpZmZlcj9cclxuICAgIGlmIChpICE9IGopIHJldHVybiBpO1xyXG5cclxuICAgIGlzbmVnID0gaSA8IDA7XHJcblxyXG4gICAgLy8gQ29tcGFyZSBleHBvbmVudHMuXHJcbiAgICBpZiAoayAhPSBsKSByZXR1cm4gayA+IGwgXiBpc25lZyA/IDEgOiAtMTtcclxuXHJcbiAgICBqID0gKGsgPSB4Yy5sZW5ndGgpIDwgKGwgPSB5Yy5sZW5ndGgpID8gayA6IGw7XHJcblxyXG4gICAgLy8gQ29tcGFyZSBkaWdpdCBieSBkaWdpdC5cclxuICAgIGZvciAoaSA9IC0xOyArK2kgPCBqOykge1xyXG4gICAgICBpZiAoeGNbaV0gIT0geWNbaV0pIHJldHVybiB4Y1tpXSA+IHljW2ldIF4gaXNuZWcgPyAxIDogLTE7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQ29tcGFyZSBsZW5ndGhzLlxyXG4gICAgcmV0dXJuIGsgPT0gbCA/IDAgOiBrID4gbCBeIGlzbmVnID8gMSA6IC0xO1xyXG4gIH07XHJcblxyXG5cclxuICAvKlxyXG4gICAqIFJldHVybiBhIG5ldyBCaWcgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXMgQmlnIGRpdmlkZWQgYnkgdGhlIHZhbHVlIG9mIEJpZyB5LCByb3VuZGVkLFxyXG4gICAqIGlmIG5lY2Vzc2FyeSwgdG8gYSBtYXhpbXVtIG9mIEJpZy5EUCBkZWNpbWFsIHBsYWNlcyB1c2luZyByb3VuZGluZyBtb2RlIEJpZy5STS5cclxuICAgKi9cclxuICBQLmRpdiA9IGZ1bmN0aW9uICh5KSB7XHJcbiAgICB2YXIgeCA9IHRoaXMsXHJcbiAgICAgIEJpZyA9IHguY29uc3RydWN0b3IsXHJcbiAgICAgIGEgPSB4LmMsICAgICAgICAgICAgICAgICAgLy8gZGl2aWRlbmRcclxuICAgICAgYiA9ICh5ID0gbmV3IEJpZyh5KSkuYywgICAvLyBkaXZpc29yXHJcbiAgICAgIGsgPSB4LnMgPT0geS5zID8gMSA6IC0xLFxyXG4gICAgICBkcCA9IEJpZy5EUDtcclxuXHJcbiAgICBpZiAoZHAgIT09IH5+ZHAgfHwgZHAgPCAwIHx8IGRwID4gTUFYX0RQKSB7XHJcbiAgICAgIHRocm93IEVycm9yKElOVkFMSURfRFApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIERpdmlzb3IgaXMgemVybz9cclxuICAgIGlmICghYlswXSkge1xyXG4gICAgICB0aHJvdyBFcnJvcihESVZfQllfWkVSTyk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRGl2aWRlbmQgaXMgMD8gUmV0dXJuICstMC5cclxuICAgIGlmICghYVswXSkge1xyXG4gICAgICB5LnMgPSBrO1xyXG4gICAgICB5LmMgPSBbeS5lID0gMF07XHJcbiAgICAgIHJldHVybiB5O1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBibCwgYnQsIG4sIGNtcCwgcmksXHJcbiAgICAgIGJ6ID0gYi5zbGljZSgpLFxyXG4gICAgICBhaSA9IGJsID0gYi5sZW5ndGgsXHJcbiAgICAgIGFsID0gYS5sZW5ndGgsXHJcbiAgICAgIHIgPSBhLnNsaWNlKDAsIGJsKSwgICAvLyByZW1haW5kZXJcclxuICAgICAgcmwgPSByLmxlbmd0aCxcclxuICAgICAgcSA9IHksICAgICAgICAgICAgICAgIC8vIHF1b3RpZW50XHJcbiAgICAgIHFjID0gcS5jID0gW10sXHJcbiAgICAgIHFpID0gMCxcclxuICAgICAgcCA9IGRwICsgKHEuZSA9IHguZSAtIHkuZSkgKyAxOyAgICAvLyBwcmVjaXNpb24gb2YgdGhlIHJlc3VsdFxyXG5cclxuICAgIHEucyA9IGs7XHJcbiAgICBrID0gcCA8IDAgPyAwIDogcDtcclxuXHJcbiAgICAvLyBDcmVhdGUgdmVyc2lvbiBvZiBkaXZpc29yIHdpdGggbGVhZGluZyB6ZXJvLlxyXG4gICAgYnoudW5zaGlmdCgwKTtcclxuXHJcbiAgICAvLyBBZGQgemVyb3MgdG8gbWFrZSByZW1haW5kZXIgYXMgbG9uZyBhcyBkaXZpc29yLlxyXG4gICAgZm9yICg7IHJsKysgPCBibDspIHIucHVzaCgwKTtcclxuXHJcbiAgICBkbyB7XHJcblxyXG4gICAgICAvLyBuIGlzIGhvdyBtYW55IHRpbWVzIHRoZSBkaXZpc29yIGdvZXMgaW50byBjdXJyZW50IHJlbWFpbmRlci5cclxuICAgICAgZm9yIChuID0gMDsgbiA8IDEwOyBuKyspIHtcclxuXHJcbiAgICAgICAgLy8gQ29tcGFyZSBkaXZpc29yIGFuZCByZW1haW5kZXIuXHJcbiAgICAgICAgaWYgKGJsICE9IChybCA9IHIubGVuZ3RoKSkge1xyXG4gICAgICAgICAgY21wID0gYmwgPiBybCA/IDEgOiAtMTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgZm9yIChyaSA9IC0xLCBjbXAgPSAwOyArK3JpIDwgYmw7KSB7XHJcbiAgICAgICAgICAgIGlmIChiW3JpXSAhPSByW3JpXSkge1xyXG4gICAgICAgICAgICAgIGNtcCA9IGJbcmldID4gcltyaV0gPyAxIDogLTE7XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIElmIGRpdmlzb3IgPCByZW1haW5kZXIsIHN1YnRyYWN0IGRpdmlzb3IgZnJvbSByZW1haW5kZXIuXHJcbiAgICAgICAgaWYgKGNtcCA8IDApIHtcclxuXHJcbiAgICAgICAgICAvLyBSZW1haW5kZXIgY2FuJ3QgYmUgbW9yZSB0aGFuIDEgZGlnaXQgbG9uZ2VyIHRoYW4gZGl2aXNvci5cclxuICAgICAgICAgIC8vIEVxdWFsaXNlIGxlbmd0aHMgdXNpbmcgZGl2aXNvciB3aXRoIGV4dHJhIGxlYWRpbmcgemVybz9cclxuICAgICAgICAgIGZvciAoYnQgPSBybCA9PSBibCA/IGIgOiBiejsgcmw7KSB7XHJcbiAgICAgICAgICAgIGlmIChyWy0tcmxdIDwgYnRbcmxdKSB7XHJcbiAgICAgICAgICAgICAgcmkgPSBybDtcclxuICAgICAgICAgICAgICBmb3IgKDsgcmkgJiYgIXJbLS1yaV07KSByW3JpXSA9IDk7XHJcbiAgICAgICAgICAgICAgLS1yW3JpXTtcclxuICAgICAgICAgICAgICByW3JsXSArPSAxMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByW3JsXSAtPSBidFtybF07XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgZm9yICg7ICFyWzBdOykgci5zaGlmdCgpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIEFkZCB0aGUgZGlnaXQgbiB0byB0aGUgcmVzdWx0IGFycmF5LlxyXG4gICAgICBxY1txaSsrXSA9IGNtcCA/IG4gOiArK247XHJcblxyXG4gICAgICAvLyBVcGRhdGUgdGhlIHJlbWFpbmRlci5cclxuICAgICAgaWYgKHJbMF0gJiYgY21wKSByW3JsXSA9IGFbYWldIHx8IDA7XHJcbiAgICAgIGVsc2UgciA9IFthW2FpXV07XHJcblxyXG4gICAgfSB3aGlsZSAoKGFpKysgPCBhbCB8fCByWzBdICE9PSBVTkRFRklORUQpICYmIGstLSk7XHJcblxyXG4gICAgLy8gTGVhZGluZyB6ZXJvPyBEbyBub3QgcmVtb3ZlIGlmIHJlc3VsdCBpcyBzaW1wbHkgemVybyAocWkgPT0gMSkuXHJcbiAgICBpZiAoIXFjWzBdICYmIHFpICE9IDEpIHtcclxuXHJcbiAgICAgIC8vIFRoZXJlIGNhbid0IGJlIG1vcmUgdGhhbiBvbmUgemVyby5cclxuICAgICAgcWMuc2hpZnQoKTtcclxuICAgICAgcS5lLS07XHJcbiAgICAgIHAtLTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBSb3VuZD9cclxuICAgIGlmIChxaSA+IHApIHJvdW5kKHEsIHAsIEJpZy5STSwgclswXSAhPT0gVU5ERUZJTkVEKTtcclxuXHJcbiAgICByZXR1cm4gcTtcclxuICB9O1xyXG5cclxuXHJcbiAgLypcclxuICAgKiBSZXR1cm4gdHJ1ZSBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWcgaXMgZXF1YWwgdG8gdGhlIHZhbHVlIG9mIEJpZyB5LCBvdGhlcndpc2UgcmV0dXJuIGZhbHNlLlxyXG4gICAqL1xyXG4gIFAuZXEgPSBmdW5jdGlvbiAoeSkge1xyXG4gICAgcmV0dXJuIHRoaXMuY21wKHkpID09PSAwO1xyXG4gIH07XHJcblxyXG5cclxuICAvKlxyXG4gICAqIFJldHVybiB0cnVlIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZyBpcyBncmVhdGVyIHRoYW4gdGhlIHZhbHVlIG9mIEJpZyB5LCBvdGhlcndpc2UgcmV0dXJuXHJcbiAgICogZmFsc2UuXHJcbiAgICovXHJcbiAgUC5ndCA9IGZ1bmN0aW9uICh5KSB7XHJcbiAgICByZXR1cm4gdGhpcy5jbXAoeSkgPiAwO1xyXG4gIH07XHJcblxyXG5cclxuICAvKlxyXG4gICAqIFJldHVybiB0cnVlIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZyBpcyBncmVhdGVyIHRoYW4gb3IgZXF1YWwgdG8gdGhlIHZhbHVlIG9mIEJpZyB5LCBvdGhlcndpc2VcclxuICAgKiByZXR1cm4gZmFsc2UuXHJcbiAgICovXHJcbiAgUC5ndGUgPSBmdW5jdGlvbiAoeSkge1xyXG4gICAgcmV0dXJuIHRoaXMuY21wKHkpID4gLTE7XHJcbiAgfTtcclxuXHJcblxyXG4gIC8qXHJcbiAgICogUmV0dXJuIHRydWUgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnIGlzIGxlc3MgdGhhbiB0aGUgdmFsdWUgb2YgQmlnIHksIG90aGVyd2lzZSByZXR1cm4gZmFsc2UuXHJcbiAgICovXHJcbiAgUC5sdCA9IGZ1bmN0aW9uICh5KSB7XHJcbiAgICByZXR1cm4gdGhpcy5jbXAoeSkgPCAwO1xyXG4gIH07XHJcblxyXG5cclxuICAvKlxyXG4gICAqIFJldHVybiB0cnVlIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZyBpcyBsZXNzIHRoYW4gb3IgZXF1YWwgdG8gdGhlIHZhbHVlIG9mIEJpZyB5LCBvdGhlcndpc2VcclxuICAgKiByZXR1cm4gZmFsc2UuXHJcbiAgICovXHJcbiAgUC5sdGUgPSBmdW5jdGlvbiAoeSkge1xyXG4gICAgcmV0dXJuIHRoaXMuY21wKHkpIDwgMTtcclxuICB9O1xyXG5cclxuXHJcbiAgLypcclxuICAgKiBSZXR1cm4gYSBuZXcgQmlnIHdob3NlIHZhbHVlIGlzIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZyBtaW51cyB0aGUgdmFsdWUgb2YgQmlnIHkuXHJcbiAgICovXHJcbiAgUC5taW51cyA9IFAuc3ViID0gZnVuY3Rpb24gKHkpIHtcclxuICAgIHZhciBpLCBqLCB0LCB4bHR5LFxyXG4gICAgICB4ID0gdGhpcyxcclxuICAgICAgQmlnID0geC5jb25zdHJ1Y3RvcixcclxuICAgICAgYSA9IHgucyxcclxuICAgICAgYiA9ICh5ID0gbmV3IEJpZyh5KSkucztcclxuXHJcbiAgICAvLyBTaWducyBkaWZmZXI/XHJcbiAgICBpZiAoYSAhPSBiKSB7XHJcbiAgICAgIHkucyA9IC1iO1xyXG4gICAgICByZXR1cm4geC5wbHVzKHkpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciB4YyA9IHguYy5zbGljZSgpLFxyXG4gICAgICB4ZSA9IHguZSxcclxuICAgICAgeWMgPSB5LmMsXHJcbiAgICAgIHllID0geS5lO1xyXG5cclxuICAgIC8vIEVpdGhlciB6ZXJvP1xyXG4gICAgaWYgKCF4Y1swXSB8fCAheWNbMF0pIHtcclxuICAgICAgaWYgKHljWzBdKSB7XHJcbiAgICAgICAgeS5zID0gLWI7XHJcbiAgICAgIH0gZWxzZSBpZiAoeGNbMF0pIHtcclxuICAgICAgICB5ID0gbmV3IEJpZyh4KTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB5LnMgPSAxO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiB5O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIERldGVybWluZSB3aGljaCBpcyB0aGUgYmlnZ2VyIG51bWJlci4gUHJlcGVuZCB6ZXJvcyB0byBlcXVhbGlzZSBleHBvbmVudHMuXHJcbiAgICBpZiAoYSA9IHhlIC0geWUpIHtcclxuXHJcbiAgICAgIGlmICh4bHR5ID0gYSA8IDApIHtcclxuICAgICAgICBhID0gLWE7XHJcbiAgICAgICAgdCA9IHhjO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHllID0geGU7XHJcbiAgICAgICAgdCA9IHljO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0LnJldmVyc2UoKTtcclxuICAgICAgZm9yIChiID0gYTsgYi0tOykgdC5wdXNoKDApO1xyXG4gICAgICB0LnJldmVyc2UoKTtcclxuICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAvLyBFeHBvbmVudHMgZXF1YWwuIENoZWNrIGRpZ2l0IGJ5IGRpZ2l0LlxyXG4gICAgICBqID0gKCh4bHR5ID0geGMubGVuZ3RoIDwgeWMubGVuZ3RoKSA/IHhjIDogeWMpLmxlbmd0aDtcclxuXHJcbiAgICAgIGZvciAoYSA9IGIgPSAwOyBiIDwgajsgYisrKSB7XHJcbiAgICAgICAgaWYgKHhjW2JdICE9IHljW2JdKSB7XHJcbiAgICAgICAgICB4bHR5ID0geGNbYl0gPCB5Y1tiXTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIHggPCB5PyBQb2ludCB4YyB0byB0aGUgYXJyYXkgb2YgdGhlIGJpZ2dlciBudW1iZXIuXHJcbiAgICBpZiAoeGx0eSkge1xyXG4gICAgICB0ID0geGM7XHJcbiAgICAgIHhjID0geWM7XHJcbiAgICAgIHljID0gdDtcclxuICAgICAgeS5zID0gLXkucztcclxuICAgIH1cclxuXHJcbiAgICAvKlxyXG4gICAgICogQXBwZW5kIHplcm9zIHRvIHhjIGlmIHNob3J0ZXIuIE5vIG5lZWQgdG8gYWRkIHplcm9zIHRvIHljIGlmIHNob3J0ZXIgYXMgc3VidHJhY3Rpb24gb25seVxyXG4gICAgICogbmVlZHMgdG8gc3RhcnQgYXQgeWMubGVuZ3RoLlxyXG4gICAgICovXHJcbiAgICBpZiAoKGIgPSAoaiA9IHljLmxlbmd0aCkgLSAoaSA9IHhjLmxlbmd0aCkpID4gMCkgZm9yICg7IGItLTspIHhjW2krK10gPSAwO1xyXG5cclxuICAgIC8vIFN1YnRyYWN0IHljIGZyb20geGMuXHJcbiAgICBmb3IgKGIgPSBpOyBqID4gYTspIHtcclxuICAgICAgaWYgKHhjWy0tal0gPCB5Y1tqXSkge1xyXG4gICAgICAgIGZvciAoaSA9IGo7IGkgJiYgIXhjWy0taV07KSB4Y1tpXSA9IDk7XHJcbiAgICAgICAgLS14Y1tpXTtcclxuICAgICAgICB4Y1tqXSArPSAxMDtcclxuICAgICAgfVxyXG5cclxuICAgICAgeGNbal0gLT0geWNbal07XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUmVtb3ZlIHRyYWlsaW5nIHplcm9zLlxyXG4gICAgZm9yICg7IHhjWy0tYl0gPT09IDA7KSB4Yy5wb3AoKTtcclxuXHJcbiAgICAvLyBSZW1vdmUgbGVhZGluZyB6ZXJvcyBhbmQgYWRqdXN0IGV4cG9uZW50IGFjY29yZGluZ2x5LlxyXG4gICAgZm9yICg7IHhjWzBdID09PSAwOykge1xyXG4gICAgICB4Yy5zaGlmdCgpO1xyXG4gICAgICAtLXllO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICgheGNbMF0pIHtcclxuXHJcbiAgICAgIC8vIG4gLSBuID0gKzBcclxuICAgICAgeS5zID0gMTtcclxuXHJcbiAgICAgIC8vIFJlc3VsdCBtdXN0IGJlIHplcm8uXHJcbiAgICAgIHhjID0gW3llID0gMF07XHJcbiAgICB9XHJcblxyXG4gICAgeS5jID0geGM7XHJcbiAgICB5LmUgPSB5ZTtcclxuXHJcbiAgICByZXR1cm4geTtcclxuICB9O1xyXG5cclxuXHJcbiAgLypcclxuICAgKiBSZXR1cm4gYSBuZXcgQmlnIHdob3NlIHZhbHVlIGlzIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZyBtb2R1bG8gdGhlIHZhbHVlIG9mIEJpZyB5LlxyXG4gICAqL1xyXG4gIFAubW9kID0gZnVuY3Rpb24gKHkpIHtcclxuICAgIHZhciB5Z3R4LFxyXG4gICAgICB4ID0gdGhpcyxcclxuICAgICAgQmlnID0geC5jb25zdHJ1Y3RvcixcclxuICAgICAgYSA9IHgucyxcclxuICAgICAgYiA9ICh5ID0gbmV3IEJpZyh5KSkucztcclxuXHJcbiAgICBpZiAoIXkuY1swXSkge1xyXG4gICAgICB0aHJvdyBFcnJvcihESVZfQllfWkVSTyk7XHJcbiAgICB9XHJcblxyXG4gICAgeC5zID0geS5zID0gMTtcclxuICAgIHlndHggPSB5LmNtcCh4KSA9PSAxO1xyXG4gICAgeC5zID0gYTtcclxuICAgIHkucyA9IGI7XHJcblxyXG4gICAgaWYgKHlndHgpIHJldHVybiBuZXcgQmlnKHgpO1xyXG5cclxuICAgIGEgPSBCaWcuRFA7XHJcbiAgICBiID0gQmlnLlJNO1xyXG4gICAgQmlnLkRQID0gQmlnLlJNID0gMDtcclxuICAgIHggPSB4LmRpdih5KTtcclxuICAgIEJpZy5EUCA9IGE7XHJcbiAgICBCaWcuUk0gPSBiO1xyXG5cclxuICAgIHJldHVybiB0aGlzLm1pbnVzKHgudGltZXMoeSkpO1xyXG4gIH07XHJcblxyXG5cclxuICAvKlxyXG4gICAqIFJldHVybiBhIG5ldyBCaWcgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXMgQmlnIG5lZ2F0ZWQuXHJcbiAgICovXHJcbiAgUC5uZWcgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgeCA9IG5ldyB0aGlzLmNvbnN0cnVjdG9yKHRoaXMpO1xyXG4gICAgeC5zID0gLXgucztcclxuICAgIHJldHVybiB4O1xyXG4gIH07XHJcblxyXG5cclxuICAvKlxyXG4gICAqIFJldHVybiBhIG5ldyBCaWcgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXMgQmlnIHBsdXMgdGhlIHZhbHVlIG9mIEJpZyB5LlxyXG4gICAqL1xyXG4gIFAucGx1cyA9IFAuYWRkID0gZnVuY3Rpb24gKHkpIHtcclxuICAgIHZhciBlLCBrLCB0LFxyXG4gICAgICB4ID0gdGhpcyxcclxuICAgICAgQmlnID0geC5jb25zdHJ1Y3RvcjtcclxuXHJcbiAgICB5ID0gbmV3IEJpZyh5KTtcclxuXHJcbiAgICAvLyBTaWducyBkaWZmZXI/XHJcbiAgICBpZiAoeC5zICE9IHkucykge1xyXG4gICAgICB5LnMgPSAteS5zO1xyXG4gICAgICByZXR1cm4geC5taW51cyh5KTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgeGUgPSB4LmUsXHJcbiAgICAgIHhjID0geC5jLFxyXG4gICAgICB5ZSA9IHkuZSxcclxuICAgICAgeWMgPSB5LmM7XHJcblxyXG4gICAgLy8gRWl0aGVyIHplcm8/XHJcbiAgICBpZiAoIXhjWzBdIHx8ICF5Y1swXSkge1xyXG4gICAgICBpZiAoIXljWzBdKSB7XHJcbiAgICAgICAgaWYgKHhjWzBdKSB7XHJcbiAgICAgICAgICB5ID0gbmV3IEJpZyh4KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgeS5zID0geC5zO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICByZXR1cm4geTtcclxuICAgIH1cclxuXHJcbiAgICB4YyA9IHhjLnNsaWNlKCk7XHJcblxyXG4gICAgLy8gUHJlcGVuZCB6ZXJvcyB0byBlcXVhbGlzZSBleHBvbmVudHMuXHJcbiAgICAvLyBOb3RlOiByZXZlcnNlIGZhc3RlciB0aGFuIHVuc2hpZnRzLlxyXG4gICAgaWYgKGUgPSB4ZSAtIHllKSB7XHJcbiAgICAgIGlmIChlID4gMCkge1xyXG4gICAgICAgIHllID0geGU7XHJcbiAgICAgICAgdCA9IHljO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGUgPSAtZTtcclxuICAgICAgICB0ID0geGM7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHQucmV2ZXJzZSgpO1xyXG4gICAgICBmb3IgKDsgZS0tOykgdC5wdXNoKDApO1xyXG4gICAgICB0LnJldmVyc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBQb2ludCB4YyB0byB0aGUgbG9uZ2VyIGFycmF5LlxyXG4gICAgaWYgKHhjLmxlbmd0aCAtIHljLmxlbmd0aCA8IDApIHtcclxuICAgICAgdCA9IHljO1xyXG4gICAgICB5YyA9IHhjO1xyXG4gICAgICB4YyA9IHQ7XHJcbiAgICB9XHJcblxyXG4gICAgZSA9IHljLmxlbmd0aDtcclxuXHJcbiAgICAvLyBPbmx5IHN0YXJ0IGFkZGluZyBhdCB5Yy5sZW5ndGggLSAxIGFzIHRoZSBmdXJ0aGVyIGRpZ2l0cyBvZiB4YyBjYW4gYmUgbGVmdCBhcyB0aGV5IGFyZS5cclxuICAgIGZvciAoayA9IDA7IGU7IHhjW2VdICU9IDEwKSBrID0gKHhjWy0tZV0gPSB4Y1tlXSArIHljW2VdICsgaykgLyAxMCB8IDA7XHJcblxyXG4gICAgLy8gTm8gbmVlZCB0byBjaGVjayBmb3IgemVybywgYXMgK3ggKyAreSAhPSAwICYmIC14ICsgLXkgIT0gMFxyXG5cclxuICAgIGlmIChrKSB7XHJcbiAgICAgIHhjLnVuc2hpZnQoayk7XHJcbiAgICAgICsreWU7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUmVtb3ZlIHRyYWlsaW5nIHplcm9zLlxyXG4gICAgZm9yIChlID0geGMubGVuZ3RoOyB4Y1stLWVdID09PSAwOykgeGMucG9wKCk7XHJcblxyXG4gICAgeS5jID0geGM7XHJcbiAgICB5LmUgPSB5ZTtcclxuXHJcbiAgICByZXR1cm4geTtcclxuICB9O1xyXG5cclxuXHJcbiAgLypcclxuICAgKiBSZXR1cm4gYSBCaWcgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXMgQmlnIHJhaXNlZCB0byB0aGUgcG93ZXIgbi5cclxuICAgKiBJZiBuIGlzIG5lZ2F0aXZlLCByb3VuZCB0byBhIG1heGltdW0gb2YgQmlnLkRQIGRlY2ltYWwgcGxhY2VzIHVzaW5nIHJvdW5kaW5nXHJcbiAgICogbW9kZSBCaWcuUk0uXHJcbiAgICpcclxuICAgKiBuIHtudW1iZXJ9IEludGVnZXIsIC1NQVhfUE9XRVIgdG8gTUFYX1BPV0VSIGluY2x1c2l2ZS5cclxuICAgKi9cclxuICBQLnBvdyA9IGZ1bmN0aW9uIChuKSB7XHJcbiAgICB2YXIgeCA9IHRoaXMsXHJcbiAgICAgIG9uZSA9IG5ldyB4LmNvbnN0cnVjdG9yKCcxJyksXHJcbiAgICAgIHkgPSBvbmUsXHJcbiAgICAgIGlzbmVnID0gbiA8IDA7XHJcblxyXG4gICAgaWYgKG4gIT09IH5+biB8fCBuIDwgLU1BWF9QT1dFUiB8fCBuID4gTUFYX1BPV0VSKSB7XHJcbiAgICAgIHRocm93IEVycm9yKElOVkFMSUQgKyAnZXhwb25lbnQnKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoaXNuZWcpIG4gPSAtbjtcclxuXHJcbiAgICBmb3IgKDs7KSB7XHJcbiAgICAgIGlmIChuICYgMSkgeSA9IHkudGltZXMoeCk7XHJcbiAgICAgIG4gPj49IDE7XHJcbiAgICAgIGlmICghbikgYnJlYWs7XHJcbiAgICAgIHggPSB4LnRpbWVzKHgpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBpc25lZyA/IG9uZS5kaXYoeSkgOiB5O1xyXG4gIH07XHJcblxyXG5cclxuICAvKlxyXG4gICAqIFJldHVybiBhIG5ldyBCaWcgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXMgQmlnIHJvdW5kZWQgdG8gYSBtYXhpbXVtIHByZWNpc2lvbiBvZiBzZFxyXG4gICAqIHNpZ25pZmljYW50IGRpZ2l0cyB1c2luZyByb3VuZGluZyBtb2RlIHJtLCBvciBCaWcuUk0gaWYgcm0gaXMgbm90IHNwZWNpZmllZC5cclxuICAgKlxyXG4gICAqIHNkIHtudW1iZXJ9IFNpZ25pZmljYW50IGRpZ2l0czogaW50ZWdlciwgMSB0byBNQVhfRFAgaW5jbHVzaXZlLlxyXG4gICAqIHJtPyB7bnVtYmVyfSBSb3VuZGluZyBtb2RlOiAwIChkb3duKSwgMSAoaGFsZi11cCksIDIgKGhhbGYtZXZlbikgb3IgMyAodXApLlxyXG4gICAqL1xyXG4gIFAucHJlYyA9IGZ1bmN0aW9uIChzZCwgcm0pIHtcclxuICAgIGlmIChzZCAhPT0gfn5zZCB8fCBzZCA8IDEgfHwgc2QgPiBNQVhfRFApIHtcclxuICAgICAgdGhyb3cgRXJyb3IoSU5WQUxJRCArICdwcmVjaXNpb24nKTtcclxuICAgIH1cclxuICAgIHJldHVybiByb3VuZChuZXcgdGhpcy5jb25zdHJ1Y3Rvcih0aGlzKSwgc2QsIHJtKTtcclxuICB9O1xyXG5cclxuXHJcbiAgLypcclxuICAgKiBSZXR1cm4gYSBuZXcgQmlnIHdob3NlIHZhbHVlIGlzIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZyByb3VuZGVkIHRvIGEgbWF4aW11bSBvZiBkcCBkZWNpbWFsIHBsYWNlc1xyXG4gICAqIHVzaW5nIHJvdW5kaW5nIG1vZGUgcm0sIG9yIEJpZy5STSBpZiBybSBpcyBub3Qgc3BlY2lmaWVkLlxyXG4gICAqIElmIGRwIGlzIG5lZ2F0aXZlLCByb3VuZCB0byBhbiBpbnRlZ2VyIHdoaWNoIGlzIGEgbXVsdGlwbGUgb2YgMTAqKi1kcC5cclxuICAgKiBJZiBkcCBpcyBub3Qgc3BlY2lmaWVkLCByb3VuZCB0byAwIGRlY2ltYWwgcGxhY2VzLlxyXG4gICAqXHJcbiAgICogZHA/IHtudW1iZXJ9IEludGVnZXIsIC1NQVhfRFAgdG8gTUFYX0RQIGluY2x1c2l2ZS5cclxuICAgKiBybT8ge251bWJlcn0gUm91bmRpbmcgbW9kZTogMCAoZG93biksIDEgKGhhbGYtdXApLCAyIChoYWxmLWV2ZW4pIG9yIDMgKHVwKS5cclxuICAgKi9cclxuICBQLnJvdW5kID0gZnVuY3Rpb24gKGRwLCBybSkge1xyXG4gICAgaWYgKGRwID09PSBVTkRFRklORUQpIGRwID0gMDtcclxuICAgIGVsc2UgaWYgKGRwICE9PSB+fmRwIHx8IGRwIDwgLU1BWF9EUCB8fCBkcCA+IE1BWF9EUCkge1xyXG4gICAgICB0aHJvdyBFcnJvcihJTlZBTElEX0RQKTtcclxuICAgIH1cclxuICAgIHJldHVybiByb3VuZChuZXcgdGhpcy5jb25zdHJ1Y3Rvcih0aGlzKSwgZHAgKyB0aGlzLmUgKyAxLCBybSk7XHJcbiAgfTtcclxuXHJcblxyXG4gIC8qXHJcbiAgICogUmV0dXJuIGEgbmV3IEJpZyB3aG9zZSB2YWx1ZSBpcyB0aGUgc3F1YXJlIHJvb3Qgb2YgdGhlIHZhbHVlIG9mIHRoaXMgQmlnLCByb3VuZGVkLCBpZlxyXG4gICAqIG5lY2Vzc2FyeSwgdG8gYSBtYXhpbXVtIG9mIEJpZy5EUCBkZWNpbWFsIHBsYWNlcyB1c2luZyByb3VuZGluZyBtb2RlIEJpZy5STS5cclxuICAgKi9cclxuICBQLnNxcnQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgciwgYywgdCxcclxuICAgICAgeCA9IHRoaXMsXHJcbiAgICAgIEJpZyA9IHguY29uc3RydWN0b3IsXHJcbiAgICAgIHMgPSB4LnMsXHJcbiAgICAgIGUgPSB4LmUsXHJcbiAgICAgIGhhbGYgPSBuZXcgQmlnKCcwLjUnKTtcclxuXHJcbiAgICAvLyBaZXJvP1xyXG4gICAgaWYgKCF4LmNbMF0pIHJldHVybiBuZXcgQmlnKHgpO1xyXG5cclxuICAgIC8vIE5lZ2F0aXZlP1xyXG4gICAgaWYgKHMgPCAwKSB7XHJcbiAgICAgIHRocm93IEVycm9yKE5BTUUgKyAnTm8gc3F1YXJlIHJvb3QnKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBFc3RpbWF0ZS5cclxuICAgIHMgPSBNYXRoLnNxcnQoK3N0cmluZ2lmeSh4LCB0cnVlLCB0cnVlKSk7XHJcblxyXG4gICAgLy8gTWF0aC5zcXJ0IHVuZGVyZmxvdy9vdmVyZmxvdz9cclxuICAgIC8vIFJlLWVzdGltYXRlOiBwYXNzIHggY29lZmZpY2llbnQgdG8gTWF0aC5zcXJ0IGFzIGludGVnZXIsIHRoZW4gYWRqdXN0IHRoZSByZXN1bHQgZXhwb25lbnQuXHJcbiAgICBpZiAocyA9PT0gMCB8fCBzID09PSAxIC8gMCkge1xyXG4gICAgICBjID0geC5jLmpvaW4oJycpO1xyXG4gICAgICBpZiAoIShjLmxlbmd0aCArIGUgJiAxKSkgYyArPSAnMCc7XHJcbiAgICAgIHMgPSBNYXRoLnNxcnQoYyk7XHJcbiAgICAgIGUgPSAoKGUgKyAxKSAvIDIgfCAwKSAtIChlIDwgMCB8fCBlICYgMSk7XHJcbiAgICAgIHIgPSBuZXcgQmlnKChzID09IDEgLyAwID8gJzVlJyA6IChzID0gcy50b0V4cG9uZW50aWFsKCkpLnNsaWNlKDAsIHMuaW5kZXhPZignZScpICsgMSkpICsgZSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByID0gbmV3IEJpZyhzICsgJycpO1xyXG4gICAgfVxyXG5cclxuICAgIGUgPSByLmUgKyAoQmlnLkRQICs9IDQpO1xyXG5cclxuICAgIC8vIE5ld3Rvbi1SYXBoc29uIGl0ZXJhdGlvbi5cclxuICAgIGRvIHtcclxuICAgICAgdCA9IHI7XHJcbiAgICAgIHIgPSBoYWxmLnRpbWVzKHQucGx1cyh4LmRpdih0KSkpO1xyXG4gICAgfSB3aGlsZSAodC5jLnNsaWNlKDAsIGUpLmpvaW4oJycpICE9PSByLmMuc2xpY2UoMCwgZSkuam9pbignJykpO1xyXG5cclxuICAgIHJldHVybiByb3VuZChyLCAoQmlnLkRQIC09IDQpICsgci5lICsgMSwgQmlnLlJNKTtcclxuICB9O1xyXG5cclxuXHJcbiAgLypcclxuICAgKiBSZXR1cm4gYSBuZXcgQmlnIHdob3NlIHZhbHVlIGlzIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZyB0aW1lcyB0aGUgdmFsdWUgb2YgQmlnIHkuXHJcbiAgICovXHJcbiAgUC50aW1lcyA9IFAubXVsID0gZnVuY3Rpb24gKHkpIHtcclxuICAgIHZhciBjLFxyXG4gICAgICB4ID0gdGhpcyxcclxuICAgICAgQmlnID0geC5jb25zdHJ1Y3RvcixcclxuICAgICAgeGMgPSB4LmMsXHJcbiAgICAgIHljID0gKHkgPSBuZXcgQmlnKHkpKS5jLFxyXG4gICAgICBhID0geGMubGVuZ3RoLFxyXG4gICAgICBiID0geWMubGVuZ3RoLFxyXG4gICAgICBpID0geC5lLFxyXG4gICAgICBqID0geS5lO1xyXG5cclxuICAgIC8vIERldGVybWluZSBzaWduIG9mIHJlc3VsdC5cclxuICAgIHkucyA9IHgucyA9PSB5LnMgPyAxIDogLTE7XHJcblxyXG4gICAgLy8gUmV0dXJuIHNpZ25lZCAwIGlmIGVpdGhlciAwLlxyXG4gICAgaWYgKCF4Y1swXSB8fCAheWNbMF0pIHtcclxuICAgICAgeS5jID0gW3kuZSA9IDBdO1xyXG4gICAgICByZXR1cm4geTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBJbml0aWFsaXNlIGV4cG9uZW50IG9mIHJlc3VsdCBhcyB4LmUgKyB5LmUuXHJcbiAgICB5LmUgPSBpICsgajtcclxuXHJcbiAgICAvLyBJZiBhcnJheSB4YyBoYXMgZmV3ZXIgZGlnaXRzIHRoYW4geWMsIHN3YXAgeGMgYW5kIHljLCBhbmQgbGVuZ3Rocy5cclxuICAgIGlmIChhIDwgYikge1xyXG4gICAgICBjID0geGM7XHJcbiAgICAgIHhjID0geWM7XHJcbiAgICAgIHljID0gYztcclxuICAgICAgaiA9IGE7XHJcbiAgICAgIGEgPSBiO1xyXG4gICAgICBiID0gajtcclxuICAgIH1cclxuXHJcbiAgICAvLyBJbml0aWFsaXNlIGNvZWZmaWNpZW50IGFycmF5IG9mIHJlc3VsdCB3aXRoIHplcm9zLlxyXG4gICAgZm9yIChjID0gbmV3IEFycmF5KGogPSBhICsgYik7IGotLTspIGNbal0gPSAwO1xyXG5cclxuICAgIC8vIE11bHRpcGx5LlxyXG5cclxuICAgIC8vIGkgaXMgaW5pdGlhbGx5IHhjLmxlbmd0aC5cclxuICAgIGZvciAoaSA9IGI7IGktLTspIHtcclxuICAgICAgYiA9IDA7XHJcblxyXG4gICAgICAvLyBhIGlzIHljLmxlbmd0aC5cclxuICAgICAgZm9yIChqID0gYSArIGk7IGogPiBpOykge1xyXG5cclxuICAgICAgICAvLyBDdXJyZW50IHN1bSBvZiBwcm9kdWN0cyBhdCB0aGlzIGRpZ2l0IHBvc2l0aW9uLCBwbHVzIGNhcnJ5LlxyXG4gICAgICAgIGIgPSBjW2pdICsgeWNbaV0gKiB4Y1tqIC0gaSAtIDFdICsgYjtcclxuICAgICAgICBjW2otLV0gPSBiICUgMTA7XHJcblxyXG4gICAgICAgIC8vIGNhcnJ5XHJcbiAgICAgICAgYiA9IGIgLyAxMCB8IDA7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNbal0gPSBiO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEluY3JlbWVudCByZXN1bHQgZXhwb25lbnQgaWYgdGhlcmUgaXMgYSBmaW5hbCBjYXJyeSwgb3RoZXJ3aXNlIHJlbW92ZSBsZWFkaW5nIHplcm8uXHJcbiAgICBpZiAoYikgKyt5LmU7XHJcbiAgICBlbHNlIGMuc2hpZnQoKTtcclxuXHJcbiAgICAvLyBSZW1vdmUgdHJhaWxpbmcgemVyb3MuXHJcbiAgICBmb3IgKGkgPSBjLmxlbmd0aDsgIWNbLS1pXTspIGMucG9wKCk7XHJcbiAgICB5LmMgPSBjO1xyXG5cclxuICAgIHJldHVybiB5O1xyXG4gIH07XHJcblxyXG5cclxuICAvKlxyXG4gICAqIFJldHVybiBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHZhbHVlIG9mIHRoaXMgQmlnIGluIGV4cG9uZW50aWFsIG5vdGF0aW9uIHJvdW5kZWQgdG8gZHAgZml4ZWRcclxuICAgKiBkZWNpbWFsIHBsYWNlcyB1c2luZyByb3VuZGluZyBtb2RlIHJtLCBvciBCaWcuUk0gaWYgcm0gaXMgbm90IHNwZWNpZmllZC5cclxuICAgKlxyXG4gICAqIGRwPyB7bnVtYmVyfSBEZWNpbWFsIHBsYWNlczogaW50ZWdlciwgMCB0byBNQVhfRFAgaW5jbHVzaXZlLlxyXG4gICAqIHJtPyB7bnVtYmVyfSBSb3VuZGluZyBtb2RlOiAwIChkb3duKSwgMSAoaGFsZi11cCksIDIgKGhhbGYtZXZlbikgb3IgMyAodXApLlxyXG4gICAqL1xyXG4gIFAudG9FeHBvbmVudGlhbCA9IGZ1bmN0aW9uIChkcCwgcm0pIHtcclxuICAgIHZhciB4ID0gdGhpcyxcclxuICAgICAgbiA9IHguY1swXTtcclxuXHJcbiAgICBpZiAoZHAgIT09IFVOREVGSU5FRCkge1xyXG4gICAgICBpZiAoZHAgIT09IH5+ZHAgfHwgZHAgPCAwIHx8IGRwID4gTUFYX0RQKSB7XHJcbiAgICAgICAgdGhyb3cgRXJyb3IoSU5WQUxJRF9EUCk7XHJcbiAgICAgIH1cclxuICAgICAgeCA9IHJvdW5kKG5ldyB4LmNvbnN0cnVjdG9yKHgpLCArK2RwLCBybSk7XHJcbiAgICAgIGZvciAoOyB4LmMubGVuZ3RoIDwgZHA7KSB4LmMucHVzaCgwKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gc3RyaW5naWZ5KHgsIHRydWUsICEhbik7XHJcbiAgfTtcclxuXHJcblxyXG4gIC8qXHJcbiAgICogUmV0dXJuIGEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgdmFsdWUgb2YgdGhpcyBCaWcgaW4gbm9ybWFsIG5vdGF0aW9uIHJvdW5kZWQgdG8gZHAgZml4ZWRcclxuICAgKiBkZWNpbWFsIHBsYWNlcyB1c2luZyByb3VuZGluZyBtb2RlIHJtLCBvciBCaWcuUk0gaWYgcm0gaXMgbm90IHNwZWNpZmllZC5cclxuICAgKlxyXG4gICAqIGRwPyB7bnVtYmVyfSBEZWNpbWFsIHBsYWNlczogaW50ZWdlciwgMCB0byBNQVhfRFAgaW5jbHVzaXZlLlxyXG4gICAqIHJtPyB7bnVtYmVyfSBSb3VuZGluZyBtb2RlOiAwIChkb3duKSwgMSAoaGFsZi11cCksIDIgKGhhbGYtZXZlbikgb3IgMyAodXApLlxyXG4gICAqXHJcbiAgICogKC0wKS50b0ZpeGVkKDApIGlzICcwJywgYnV0ICgtMC4xKS50b0ZpeGVkKDApIGlzICctMCcuXHJcbiAgICogKC0wKS50b0ZpeGVkKDEpIGlzICcwLjAnLCBidXQgKC0wLjAxKS50b0ZpeGVkKDEpIGlzICctMC4wJy5cclxuICAgKi9cclxuICBQLnRvRml4ZWQgPSBmdW5jdGlvbiAoZHAsIHJtKSB7XHJcbiAgICB2YXIgeCA9IHRoaXMsXHJcbiAgICAgIG4gPSB4LmNbMF07XHJcblxyXG4gICAgaWYgKGRwICE9PSBVTkRFRklORUQpIHtcclxuICAgICAgaWYgKGRwICE9PSB+fmRwIHx8IGRwIDwgMCB8fCBkcCA+IE1BWF9EUCkge1xyXG4gICAgICAgIHRocm93IEVycm9yKElOVkFMSURfRFApO1xyXG4gICAgICB9XHJcbiAgICAgIHggPSByb3VuZChuZXcgeC5jb25zdHJ1Y3Rvcih4KSwgZHAgKyB4LmUgKyAxLCBybSk7XHJcblxyXG4gICAgICAvLyB4LmUgbWF5IGhhdmUgY2hhbmdlZCBpZiB0aGUgdmFsdWUgaXMgcm91bmRlZCB1cC5cclxuICAgICAgZm9yIChkcCA9IGRwICsgeC5lICsgMTsgeC5jLmxlbmd0aCA8IGRwOykgeC5jLnB1c2goMCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHN0cmluZ2lmeSh4LCBmYWxzZSwgISFuKTtcclxuICB9O1xyXG5cclxuXHJcbiAgLypcclxuICAgKiBSZXR1cm4gYSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZy5cclxuICAgKiBSZXR1cm4gZXhwb25lbnRpYWwgbm90YXRpb24gaWYgdGhpcyBCaWcgaGFzIGEgcG9zaXRpdmUgZXhwb25lbnQgZXF1YWwgdG8gb3IgZ3JlYXRlciB0aGFuXHJcbiAgICogQmlnLlBFLCBvciBhIG5lZ2F0aXZlIGV4cG9uZW50IGVxdWFsIHRvIG9yIGxlc3MgdGhhbiBCaWcuTkUuXHJcbiAgICogT21pdCB0aGUgc2lnbiBmb3IgbmVnYXRpdmUgemVyby5cclxuICAgKi9cclxuICBQLnRvSlNPTiA9IFAudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgeCA9IHRoaXMsXHJcbiAgICAgIEJpZyA9IHguY29uc3RydWN0b3I7XHJcbiAgICByZXR1cm4gc3RyaW5naWZ5KHgsIHguZSA8PSBCaWcuTkUgfHwgeC5lID49IEJpZy5QRSwgISF4LmNbMF0pO1xyXG4gIH07XHJcblxyXG5cclxuICAvKlxyXG4gICAqIFJldHVybiB0aGUgdmFsdWUgb2YgdGhpcyBCaWcgYXMgYSBwcmltaXR2ZSBudW1iZXIuXHJcbiAgICovXHJcbiAgUC50b051bWJlciA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBuID0gK3N0cmluZ2lmeSh0aGlzLCB0cnVlLCB0cnVlKTtcclxuICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLnN0cmljdCA9PT0gdHJ1ZSAmJiAhdGhpcy5lcShuLnRvU3RyaW5nKCkpKSB7XHJcbiAgICAgIHRocm93IEVycm9yKE5BTUUgKyAnSW1wcmVjaXNlIGNvbnZlcnNpb24nKTtcclxuICAgIH1cclxuICAgIHJldHVybiBuO1xyXG4gIH07XHJcblxyXG5cclxuICAvKlxyXG4gICAqIFJldHVybiBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHZhbHVlIG9mIHRoaXMgQmlnIHJvdW5kZWQgdG8gc2Qgc2lnbmlmaWNhbnQgZGlnaXRzIHVzaW5nXHJcbiAgICogcm91bmRpbmcgbW9kZSBybSwgb3IgQmlnLlJNIGlmIHJtIGlzIG5vdCBzcGVjaWZpZWQuXHJcbiAgICogVXNlIGV4cG9uZW50aWFsIG5vdGF0aW9uIGlmIHNkIGlzIGxlc3MgdGhhbiB0aGUgbnVtYmVyIG9mIGRpZ2l0cyBuZWNlc3NhcnkgdG8gcmVwcmVzZW50XHJcbiAgICogdGhlIGludGVnZXIgcGFydCBvZiB0aGUgdmFsdWUgaW4gbm9ybWFsIG5vdGF0aW9uLlxyXG4gICAqXHJcbiAgICogc2Qge251bWJlcn0gU2lnbmlmaWNhbnQgZGlnaXRzOiBpbnRlZ2VyLCAxIHRvIE1BWF9EUCBpbmNsdXNpdmUuXHJcbiAgICogcm0/IHtudW1iZXJ9IFJvdW5kaW5nIG1vZGU6IDAgKGRvd24pLCAxIChoYWxmLXVwKSwgMiAoaGFsZi1ldmVuKSBvciAzICh1cCkuXHJcbiAgICovXHJcbiAgUC50b1ByZWNpc2lvbiA9IGZ1bmN0aW9uIChzZCwgcm0pIHtcclxuICAgIHZhciB4ID0gdGhpcyxcclxuICAgICAgQmlnID0geC5jb25zdHJ1Y3RvcixcclxuICAgICAgbiA9IHguY1swXTtcclxuXHJcbiAgICBpZiAoc2QgIT09IFVOREVGSU5FRCkge1xyXG4gICAgICBpZiAoc2QgIT09IH5+c2QgfHwgc2QgPCAxIHx8IHNkID4gTUFYX0RQKSB7XHJcbiAgICAgICAgdGhyb3cgRXJyb3IoSU5WQUxJRCArICdwcmVjaXNpb24nKTtcclxuICAgICAgfVxyXG4gICAgICB4ID0gcm91bmQobmV3IEJpZyh4KSwgc2QsIHJtKTtcclxuICAgICAgZm9yICg7IHguYy5sZW5ndGggPCBzZDspIHguYy5wdXNoKDApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBzdHJpbmdpZnkoeCwgc2QgPD0geC5lIHx8IHguZSA8PSBCaWcuTkUgfHwgeC5lID49IEJpZy5QRSwgISFuKTtcclxuICB9O1xyXG5cclxuXHJcbiAgLypcclxuICAgKiBSZXR1cm4gYSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZy5cclxuICAgKiBSZXR1cm4gZXhwb25lbnRpYWwgbm90YXRpb24gaWYgdGhpcyBCaWcgaGFzIGEgcG9zaXRpdmUgZXhwb25lbnQgZXF1YWwgdG8gb3IgZ3JlYXRlciB0aGFuXHJcbiAgICogQmlnLlBFLCBvciBhIG5lZ2F0aXZlIGV4cG9uZW50IGVxdWFsIHRvIG9yIGxlc3MgdGhhbiBCaWcuTkUuXHJcbiAgICogSW5jbHVkZSB0aGUgc2lnbiBmb3IgbmVnYXRpdmUgemVyby5cclxuICAgKi9cclxuICBQLnZhbHVlT2YgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgeCA9IHRoaXMsXHJcbiAgICAgIEJpZyA9IHguY29uc3RydWN0b3I7XHJcbiAgICBpZiAoQmlnLnN0cmljdCA9PT0gdHJ1ZSkge1xyXG4gICAgICB0aHJvdyBFcnJvcihOQU1FICsgJ3ZhbHVlT2YgZGlzYWxsb3dlZCcpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHN0cmluZ2lmeSh4LCB4LmUgPD0gQmlnLk5FIHx8IHguZSA+PSBCaWcuUEUsIHRydWUpO1xyXG4gIH07XHJcblxyXG5cclxuICAvLyBFeHBvcnRcclxuXHJcblxyXG4gIEJpZyA9IF9CaWdfKCk7XHJcblxyXG4gIEJpZ1snZGVmYXVsdCddID0gQmlnLkJpZyA9IEJpZztcclxuXHJcbiAgLy9BTUQuXHJcbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xyXG4gICAgZGVmaW5lKGZ1bmN0aW9uICgpIHsgcmV0dXJuIEJpZzsgfSk7XHJcblxyXG4gIC8vIE5vZGUgYW5kIG90aGVyIENvbW1vbkpTLWxpa2UgZW52aXJvbm1lbnRzIHRoYXQgc3VwcG9ydCBtb2R1bGUuZXhwb3J0cy5cclxuICB9IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IEJpZztcclxuXHJcbiAgLy9Ccm93c2VyLlxyXG4gIH0gZWxzZSB7XHJcbiAgICBHTE9CQUwuQmlnID0gQmlnO1xyXG4gIH1cclxufSkodGhpcyk7XHJcbiIsIi8qIVxuICogVGhlIGJ1ZmZlciBtb2R1bGUgZnJvbSBub2RlLmpzLCBmb3IgdGhlIGJyb3dzZXIuXG4gKlxuICogQGF1dGhvciAgIEZlcm9zcyBBYm91a2hhZGlqZWggPGh0dHBzOi8vZmVyb3NzLm9yZz5cbiAqIEBsaWNlbnNlICBNSVRcbiAqL1xuLyogZXNsaW50LWRpc2FibGUgbm8tcHJvdG8gKi9cblxuJ3VzZSBzdHJpY3QnXG5cbnZhciBiYXNlNjQgPSByZXF1aXJlKCdiYXNlNjQtanMnKVxudmFyIGllZWU3NTQgPSByZXF1aXJlKCdpZWVlNzU0JylcblxuZXhwb3J0cy5CdWZmZXIgPSBCdWZmZXJcbmV4cG9ydHMuU2xvd0J1ZmZlciA9IFNsb3dCdWZmZXJcbmV4cG9ydHMuSU5TUEVDVF9NQVhfQllURVMgPSA1MFxuXG52YXIgS19NQVhfTEVOR1RIID0gMHg3ZmZmZmZmZlxuZXhwb3J0cy5rTWF4TGVuZ3RoID0gS19NQVhfTEVOR1RIXG5cbi8qKlxuICogSWYgYEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUYDpcbiAqICAgPT09IHRydWUgICAgVXNlIFVpbnQ4QXJyYXkgaW1wbGVtZW50YXRpb24gKGZhc3Rlc3QpXG4gKiAgID09PSBmYWxzZSAgIFByaW50IHdhcm5pbmcgYW5kIHJlY29tbWVuZCB1c2luZyBgYnVmZmVyYCB2NC54IHdoaWNoIGhhcyBhbiBPYmplY3RcbiAqICAgICAgICAgICAgICAgaW1wbGVtZW50YXRpb24gKG1vc3QgY29tcGF0aWJsZSwgZXZlbiBJRTYpXG4gKlxuICogQnJvd3NlcnMgdGhhdCBzdXBwb3J0IHR5cGVkIGFycmF5cyBhcmUgSUUgMTArLCBGaXJlZm94IDQrLCBDaHJvbWUgNyssIFNhZmFyaSA1LjErLFxuICogT3BlcmEgMTEuNissIGlPUyA0LjIrLlxuICpcbiAqIFdlIHJlcG9ydCB0aGF0IHRoZSBicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgdHlwZWQgYXJyYXlzIGlmIHRoZSBhcmUgbm90IHN1YmNsYXNzYWJsZVxuICogdXNpbmcgX19wcm90b19fLiBGaXJlZm94IDQtMjkgbGFja3Mgc3VwcG9ydCBmb3IgYWRkaW5nIG5ldyBwcm9wZXJ0aWVzIHRvIGBVaW50OEFycmF5YFxuICogKFNlZTogaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9Njk1NDM4KS4gSUUgMTAgbGFja3Mgc3VwcG9ydFxuICogZm9yIF9fcHJvdG9fXyBhbmQgaGFzIGEgYnVnZ3kgdHlwZWQgYXJyYXkgaW1wbGVtZW50YXRpb24uXG4gKi9cbkJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUID0gdHlwZWRBcnJheVN1cHBvcnQoKVxuXG5pZiAoIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUICYmIHR5cGVvZiBjb25zb2xlICE9PSAndW5kZWZpbmVkJyAmJlxuICAgIHR5cGVvZiBjb25zb2xlLmVycm9yID09PSAnZnVuY3Rpb24nKSB7XG4gIGNvbnNvbGUuZXJyb3IoXG4gICAgJ1RoaXMgYnJvd3NlciBsYWNrcyB0eXBlZCBhcnJheSAoVWludDhBcnJheSkgc3VwcG9ydCB3aGljaCBpcyByZXF1aXJlZCBieSAnICtcbiAgICAnYGJ1ZmZlcmAgdjUueC4gVXNlIGBidWZmZXJgIHY0LnggaWYgeW91IHJlcXVpcmUgb2xkIGJyb3dzZXIgc3VwcG9ydC4nXG4gIClcbn1cblxuZnVuY3Rpb24gdHlwZWRBcnJheVN1cHBvcnQgKCkge1xuICAvLyBDYW4gdHlwZWQgYXJyYXkgaW5zdGFuY2VzIGNhbiBiZSBhdWdtZW50ZWQ/XG4gIHRyeSB7XG4gICAgdmFyIGFyciA9IG5ldyBVaW50OEFycmF5KDEpXG4gICAgYXJyLl9fcHJvdG9fXyA9IHsgX19wcm90b19fOiBVaW50OEFycmF5LnByb3RvdHlwZSwgZm9vOiBmdW5jdGlvbiAoKSB7IHJldHVybiA0MiB9IH1cbiAgICByZXR1cm4gYXJyLmZvbygpID09PSA0MlxuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbn1cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KEJ1ZmZlci5wcm90b3R5cGUsICdwYXJlbnQnLCB7XG4gIGVudW1lcmFibGU6IHRydWUsXG4gIGdldDogZnVuY3Rpb24gKCkge1xuICAgIGlmICghQnVmZmVyLmlzQnVmZmVyKHRoaXMpKSByZXR1cm4gdW5kZWZpbmVkXG4gICAgcmV0dXJuIHRoaXMuYnVmZmVyXG4gIH1cbn0pXG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShCdWZmZXIucHJvdG90eXBlLCAnb2Zmc2V0Jywge1xuICBlbnVtZXJhYmxlOiB0cnVlLFxuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcih0aGlzKSkgcmV0dXJuIHVuZGVmaW5lZFxuICAgIHJldHVybiB0aGlzLmJ5dGVPZmZzZXRcbiAgfVxufSlcblxuZnVuY3Rpb24gY3JlYXRlQnVmZmVyIChsZW5ndGgpIHtcbiAgaWYgKGxlbmd0aCA+IEtfTUFYX0xFTkdUSCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdUaGUgdmFsdWUgXCInICsgbGVuZ3RoICsgJ1wiIGlzIGludmFsaWQgZm9yIG9wdGlvbiBcInNpemVcIicpXG4gIH1cbiAgLy8gUmV0dXJuIGFuIGF1Z21lbnRlZCBgVWludDhBcnJheWAgaW5zdGFuY2VcbiAgdmFyIGJ1ZiA9IG5ldyBVaW50OEFycmF5KGxlbmd0aClcbiAgYnVmLl9fcHJvdG9fXyA9IEJ1ZmZlci5wcm90b3R5cGVcbiAgcmV0dXJuIGJ1ZlxufVxuXG4vKipcbiAqIFRoZSBCdWZmZXIgY29uc3RydWN0b3IgcmV0dXJucyBpbnN0YW5jZXMgb2YgYFVpbnQ4QXJyYXlgIHRoYXQgaGF2ZSB0aGVpclxuICogcHJvdG90eXBlIGNoYW5nZWQgdG8gYEJ1ZmZlci5wcm90b3R5cGVgLiBGdXJ0aGVybW9yZSwgYEJ1ZmZlcmAgaXMgYSBzdWJjbGFzcyBvZlxuICogYFVpbnQ4QXJyYXlgLCBzbyB0aGUgcmV0dXJuZWQgaW5zdGFuY2VzIHdpbGwgaGF2ZSBhbGwgdGhlIG5vZGUgYEJ1ZmZlcmAgbWV0aG9kc1xuICogYW5kIHRoZSBgVWludDhBcnJheWAgbWV0aG9kcy4gU3F1YXJlIGJyYWNrZXQgbm90YXRpb24gd29ya3MgYXMgZXhwZWN0ZWQgLS0gaXRcbiAqIHJldHVybnMgYSBzaW5nbGUgb2N0ZXQuXG4gKlxuICogVGhlIGBVaW50OEFycmF5YCBwcm90b3R5cGUgcmVtYWlucyB1bm1vZGlmaWVkLlxuICovXG5cbmZ1bmN0aW9uIEJ1ZmZlciAoYXJnLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpIHtcbiAgLy8gQ29tbW9uIGNhc2UuXG4gIGlmICh0eXBlb2YgYXJnID09PSAnbnVtYmVyJykge1xuICAgIGlmICh0eXBlb2YgZW5jb2RpbmdPck9mZnNldCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICdUaGUgXCJzdHJpbmdcIiBhcmd1bWVudCBtdXN0IGJlIG9mIHR5cGUgc3RyaW5nLiBSZWNlaXZlZCB0eXBlIG51bWJlcidcbiAgICAgIClcbiAgICB9XG4gICAgcmV0dXJuIGFsbG9jVW5zYWZlKGFyZylcbiAgfVxuICByZXR1cm4gZnJvbShhcmcsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aClcbn1cblxuLy8gRml4IHN1YmFycmF5KCkgaW4gRVMyMDE2LiBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyL3B1bGwvOTdcbmlmICh0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wuc3BlY2llcyAhPSBudWxsICYmXG4gICAgQnVmZmVyW1N5bWJvbC5zcGVjaWVzXSA9PT0gQnVmZmVyKSB7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShCdWZmZXIsIFN5bWJvbC5zcGVjaWVzLCB7XG4gICAgdmFsdWU6IG51bGwsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgIHdyaXRhYmxlOiBmYWxzZVxuICB9KVxufVxuXG5CdWZmZXIucG9vbFNpemUgPSA4MTkyIC8vIG5vdCB1c2VkIGJ5IHRoaXMgaW1wbGVtZW50YXRpb25cblxuZnVuY3Rpb24gZnJvbSAodmFsdWUsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aCkge1xuICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBmcm9tU3RyaW5nKHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0KVxuICB9XG5cbiAgaWYgKEFycmF5QnVmZmVyLmlzVmlldyh2YWx1ZSkpIHtcbiAgICByZXR1cm4gZnJvbUFycmF5TGlrZSh2YWx1ZSlcbiAgfVxuXG4gIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgdGhyb3cgVHlwZUVycm9yKFxuICAgICAgJ1RoZSBmaXJzdCBhcmd1bWVudCBtdXN0IGJlIG9uZSBvZiB0eXBlIHN0cmluZywgQnVmZmVyLCBBcnJheUJ1ZmZlciwgQXJyYXksICcgK1xuICAgICAgJ29yIEFycmF5LWxpa2UgT2JqZWN0LiBSZWNlaXZlZCB0eXBlICcgKyAodHlwZW9mIHZhbHVlKVxuICAgIClcbiAgfVxuXG4gIGlmIChpc0luc3RhbmNlKHZhbHVlLCBBcnJheUJ1ZmZlcikgfHxcbiAgICAgICh2YWx1ZSAmJiBpc0luc3RhbmNlKHZhbHVlLmJ1ZmZlciwgQXJyYXlCdWZmZXIpKSkge1xuICAgIHJldHVybiBmcm9tQXJyYXlCdWZmZXIodmFsdWUsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aClcbiAgfVxuXG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICdUaGUgXCJ2YWx1ZVwiIGFyZ3VtZW50IG11c3Qgbm90IGJlIG9mIHR5cGUgbnVtYmVyLiBSZWNlaXZlZCB0eXBlIG51bWJlcidcbiAgICApXG4gIH1cblxuICB2YXIgdmFsdWVPZiA9IHZhbHVlLnZhbHVlT2YgJiYgdmFsdWUudmFsdWVPZigpXG4gIGlmICh2YWx1ZU9mICE9IG51bGwgJiYgdmFsdWVPZiAhPT0gdmFsdWUpIHtcbiAgICByZXR1cm4gQnVmZmVyLmZyb20odmFsdWVPZiwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKVxuICB9XG5cbiAgdmFyIGIgPSBmcm9tT2JqZWN0KHZhbHVlKVxuICBpZiAoYikgcmV0dXJuIGJcblxuICBpZiAodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvUHJpbWl0aXZlICE9IG51bGwgJiZcbiAgICAgIHR5cGVvZiB2YWx1ZVtTeW1ib2wudG9QcmltaXRpdmVdID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIEJ1ZmZlci5mcm9tKFxuICAgICAgdmFsdWVbU3ltYm9sLnRvUHJpbWl0aXZlXSgnc3RyaW5nJyksIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aFxuICAgIClcbiAgfVxuXG4gIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgJ1RoZSBmaXJzdCBhcmd1bWVudCBtdXN0IGJlIG9uZSBvZiB0eXBlIHN0cmluZywgQnVmZmVyLCBBcnJheUJ1ZmZlciwgQXJyYXksICcgK1xuICAgICdvciBBcnJheS1saWtlIE9iamVjdC4gUmVjZWl2ZWQgdHlwZSAnICsgKHR5cGVvZiB2YWx1ZSlcbiAgKVxufVxuXG4vKipcbiAqIEZ1bmN0aW9uYWxseSBlcXVpdmFsZW50IHRvIEJ1ZmZlcihhcmcsIGVuY29kaW5nKSBidXQgdGhyb3dzIGEgVHlwZUVycm9yXG4gKiBpZiB2YWx1ZSBpcyBhIG51bWJlci5cbiAqIEJ1ZmZlci5mcm9tKHN0clssIGVuY29kaW5nXSlcbiAqIEJ1ZmZlci5mcm9tKGFycmF5KVxuICogQnVmZmVyLmZyb20oYnVmZmVyKVxuICogQnVmZmVyLmZyb20oYXJyYXlCdWZmZXJbLCBieXRlT2Zmc2V0WywgbGVuZ3RoXV0pXG4gKiovXG5CdWZmZXIuZnJvbSA9IGZ1bmN0aW9uICh2YWx1ZSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBmcm9tKHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpXG59XG5cbi8vIE5vdGU6IENoYW5nZSBwcm90b3R5cGUgKmFmdGVyKiBCdWZmZXIuZnJvbSBpcyBkZWZpbmVkIHRvIHdvcmthcm91bmQgQ2hyb21lIGJ1Zzpcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyL3B1bGwvMTQ4XG5CdWZmZXIucHJvdG90eXBlLl9fcHJvdG9fXyA9IFVpbnQ4QXJyYXkucHJvdG90eXBlXG5CdWZmZXIuX19wcm90b19fID0gVWludDhBcnJheVxuXG5mdW5jdGlvbiBhc3NlcnRTaXplIChzaXplKSB7XG4gIGlmICh0eXBlb2Ygc2l6ZSAhPT0gJ251bWJlcicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcInNpemVcIiBhcmd1bWVudCBtdXN0IGJlIG9mIHR5cGUgbnVtYmVyJylcbiAgfSBlbHNlIGlmIChzaXplIDwgMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdUaGUgdmFsdWUgXCInICsgc2l6ZSArICdcIiBpcyBpbnZhbGlkIGZvciBvcHRpb24gXCJzaXplXCInKVxuICB9XG59XG5cbmZ1bmN0aW9uIGFsbG9jIChzaXplLCBmaWxsLCBlbmNvZGluZykge1xuICBhc3NlcnRTaXplKHNpemUpXG4gIGlmIChzaXplIDw9IDApIHtcbiAgICByZXR1cm4gY3JlYXRlQnVmZmVyKHNpemUpXG4gIH1cbiAgaWYgKGZpbGwgIT09IHVuZGVmaW5lZCkge1xuICAgIC8vIE9ubHkgcGF5IGF0dGVudGlvbiB0byBlbmNvZGluZyBpZiBpdCdzIGEgc3RyaW5nLiBUaGlzXG4gICAgLy8gcHJldmVudHMgYWNjaWRlbnRhbGx5IHNlbmRpbmcgaW4gYSBudW1iZXIgdGhhdCB3b3VsZFxuICAgIC8vIGJlIGludGVycHJldHRlZCBhcyBhIHN0YXJ0IG9mZnNldC5cbiAgICByZXR1cm4gdHlwZW9mIGVuY29kaW5nID09PSAnc3RyaW5nJ1xuICAgICAgPyBjcmVhdGVCdWZmZXIoc2l6ZSkuZmlsbChmaWxsLCBlbmNvZGluZylcbiAgICAgIDogY3JlYXRlQnVmZmVyKHNpemUpLmZpbGwoZmlsbClcbiAgfVxuICByZXR1cm4gY3JlYXRlQnVmZmVyKHNpemUpXG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBmaWxsZWQgQnVmZmVyIGluc3RhbmNlLlxuICogYWxsb2Moc2l6ZVssIGZpbGxbLCBlbmNvZGluZ11dKVxuICoqL1xuQnVmZmVyLmFsbG9jID0gZnVuY3Rpb24gKHNpemUsIGZpbGwsIGVuY29kaW5nKSB7XG4gIHJldHVybiBhbGxvYyhzaXplLCBmaWxsLCBlbmNvZGluZylcbn1cblxuZnVuY3Rpb24gYWxsb2NVbnNhZmUgKHNpemUpIHtcbiAgYXNzZXJ0U2l6ZShzaXplKVxuICByZXR1cm4gY3JlYXRlQnVmZmVyKHNpemUgPCAwID8gMCA6IGNoZWNrZWQoc2l6ZSkgfCAwKVxufVxuXG4vKipcbiAqIEVxdWl2YWxlbnQgdG8gQnVmZmVyKG51bSksIGJ5IGRlZmF1bHQgY3JlYXRlcyBhIG5vbi16ZXJvLWZpbGxlZCBCdWZmZXIgaW5zdGFuY2UuXG4gKiAqL1xuQnVmZmVyLmFsbG9jVW5zYWZlID0gZnVuY3Rpb24gKHNpemUpIHtcbiAgcmV0dXJuIGFsbG9jVW5zYWZlKHNpemUpXG59XG4vKipcbiAqIEVxdWl2YWxlbnQgdG8gU2xvd0J1ZmZlcihudW0pLCBieSBkZWZhdWx0IGNyZWF0ZXMgYSBub24temVyby1maWxsZWQgQnVmZmVyIGluc3RhbmNlLlxuICovXG5CdWZmZXIuYWxsb2NVbnNhZmVTbG93ID0gZnVuY3Rpb24gKHNpemUpIHtcbiAgcmV0dXJuIGFsbG9jVW5zYWZlKHNpemUpXG59XG5cbmZ1bmN0aW9uIGZyb21TdHJpbmcgKHN0cmluZywgZW5jb2RpbmcpIHtcbiAgaWYgKHR5cGVvZiBlbmNvZGluZyAhPT0gJ3N0cmluZycgfHwgZW5jb2RpbmcgPT09ICcnKSB7XG4gICAgZW5jb2RpbmcgPSAndXRmOCdcbiAgfVxuXG4gIGlmICghQnVmZmVyLmlzRW5jb2RpbmcoZW5jb2RpbmcpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICB9XG5cbiAgdmFyIGxlbmd0aCA9IGJ5dGVMZW5ndGgoc3RyaW5nLCBlbmNvZGluZykgfCAwXG4gIHZhciBidWYgPSBjcmVhdGVCdWZmZXIobGVuZ3RoKVxuXG4gIHZhciBhY3R1YWwgPSBidWYud3JpdGUoc3RyaW5nLCBlbmNvZGluZylcblxuICBpZiAoYWN0dWFsICE9PSBsZW5ndGgpIHtcbiAgICAvLyBXcml0aW5nIGEgaGV4IHN0cmluZywgZm9yIGV4YW1wbGUsIHRoYXQgY29udGFpbnMgaW52YWxpZCBjaGFyYWN0ZXJzIHdpbGxcbiAgICAvLyBjYXVzZSBldmVyeXRoaW5nIGFmdGVyIHRoZSBmaXJzdCBpbnZhbGlkIGNoYXJhY3RlciB0byBiZSBpZ25vcmVkLiAoZS5nLlxuICAgIC8vICdhYnh4Y2QnIHdpbGwgYmUgdHJlYXRlZCBhcyAnYWInKVxuICAgIGJ1ZiA9IGJ1Zi5zbGljZSgwLCBhY3R1YWwpXG4gIH1cblxuICByZXR1cm4gYnVmXG59XG5cbmZ1bmN0aW9uIGZyb21BcnJheUxpa2UgKGFycmF5KSB7XG4gIHZhciBsZW5ndGggPSBhcnJheS5sZW5ndGggPCAwID8gMCA6IGNoZWNrZWQoYXJyYXkubGVuZ3RoKSB8IDBcbiAgdmFyIGJ1ZiA9IGNyZWF0ZUJ1ZmZlcihsZW5ndGgpXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICBidWZbaV0gPSBhcnJheVtpXSAmIDI1NVxuICB9XG4gIHJldHVybiBidWZcbn1cblxuZnVuY3Rpb24gZnJvbUFycmF5QnVmZmVyIChhcnJheSwgYnl0ZU9mZnNldCwgbGVuZ3RoKSB7XG4gIGlmIChieXRlT2Zmc2V0IDwgMCB8fCBhcnJheS5ieXRlTGVuZ3RoIDwgYnl0ZU9mZnNldCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdcIm9mZnNldFwiIGlzIG91dHNpZGUgb2YgYnVmZmVyIGJvdW5kcycpXG4gIH1cblxuICBpZiAoYXJyYXkuYnl0ZUxlbmd0aCA8IGJ5dGVPZmZzZXQgKyAobGVuZ3RoIHx8IDApKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1wibGVuZ3RoXCIgaXMgb3V0c2lkZSBvZiBidWZmZXIgYm91bmRzJylcbiAgfVxuXG4gIHZhciBidWZcbiAgaWYgKGJ5dGVPZmZzZXQgPT09IHVuZGVmaW5lZCAmJiBsZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgIGJ1ZiA9IG5ldyBVaW50OEFycmF5KGFycmF5KVxuICB9IGVsc2UgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgYnVmID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXksIGJ5dGVPZmZzZXQpXG4gIH0gZWxzZSB7XG4gICAgYnVmID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXksIGJ5dGVPZmZzZXQsIGxlbmd0aClcbiAgfVxuXG4gIC8vIFJldHVybiBhbiBhdWdtZW50ZWQgYFVpbnQ4QXJyYXlgIGluc3RhbmNlXG4gIGJ1Zi5fX3Byb3RvX18gPSBCdWZmZXIucHJvdG90eXBlXG4gIHJldHVybiBidWZcbn1cblxuZnVuY3Rpb24gZnJvbU9iamVjdCAob2JqKSB7XG4gIGlmIChCdWZmZXIuaXNCdWZmZXIob2JqKSkge1xuICAgIHZhciBsZW4gPSBjaGVja2VkKG9iai5sZW5ndGgpIHwgMFxuICAgIHZhciBidWYgPSBjcmVhdGVCdWZmZXIobGVuKVxuXG4gICAgaWYgKGJ1Zi5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBidWZcbiAgICB9XG5cbiAgICBvYmouY29weShidWYsIDAsIDAsIGxlbilcbiAgICByZXR1cm4gYnVmXG4gIH1cblxuICBpZiAob2JqLmxlbmd0aCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKHR5cGVvZiBvYmoubGVuZ3RoICE9PSAnbnVtYmVyJyB8fCBudW1iZXJJc05hTihvYmoubGVuZ3RoKSkge1xuICAgICAgcmV0dXJuIGNyZWF0ZUJ1ZmZlcigwKVxuICAgIH1cbiAgICByZXR1cm4gZnJvbUFycmF5TGlrZShvYmopXG4gIH1cblxuICBpZiAob2JqLnR5cGUgPT09ICdCdWZmZXInICYmIEFycmF5LmlzQXJyYXkob2JqLmRhdGEpKSB7XG4gICAgcmV0dXJuIGZyb21BcnJheUxpa2Uob2JqLmRhdGEpXG4gIH1cbn1cblxuZnVuY3Rpb24gY2hlY2tlZCAobGVuZ3RoKSB7XG4gIC8vIE5vdGU6IGNhbm5vdCB1c2UgYGxlbmd0aCA8IEtfTUFYX0xFTkdUSGAgaGVyZSBiZWNhdXNlIHRoYXQgZmFpbHMgd2hlblxuICAvLyBsZW5ndGggaXMgTmFOICh3aGljaCBpcyBvdGhlcndpc2UgY29lcmNlZCB0byB6ZXJvLilcbiAgaWYgKGxlbmd0aCA+PSBLX01BWF9MRU5HVEgpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQXR0ZW1wdCB0byBhbGxvY2F0ZSBCdWZmZXIgbGFyZ2VyIHRoYW4gbWF4aW11bSAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAnc2l6ZTogMHgnICsgS19NQVhfTEVOR1RILnRvU3RyaW5nKDE2KSArICcgYnl0ZXMnKVxuICB9XG4gIHJldHVybiBsZW5ndGggfCAwXG59XG5cbmZ1bmN0aW9uIFNsb3dCdWZmZXIgKGxlbmd0aCkge1xuICBpZiAoK2xlbmd0aCAhPSBsZW5ndGgpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBlcWVxZXFcbiAgICBsZW5ndGggPSAwXG4gIH1cbiAgcmV0dXJuIEJ1ZmZlci5hbGxvYygrbGVuZ3RoKVxufVxuXG5CdWZmZXIuaXNCdWZmZXIgPSBmdW5jdGlvbiBpc0J1ZmZlciAoYikge1xuICByZXR1cm4gYiAhPSBudWxsICYmIGIuX2lzQnVmZmVyID09PSB0cnVlICYmXG4gICAgYiAhPT0gQnVmZmVyLnByb3RvdHlwZSAvLyBzbyBCdWZmZXIuaXNCdWZmZXIoQnVmZmVyLnByb3RvdHlwZSkgd2lsbCBiZSBmYWxzZVxufVxuXG5CdWZmZXIuY29tcGFyZSA9IGZ1bmN0aW9uIGNvbXBhcmUgKGEsIGIpIHtcbiAgaWYgKGlzSW5zdGFuY2UoYSwgVWludDhBcnJheSkpIGEgPSBCdWZmZXIuZnJvbShhLCBhLm9mZnNldCwgYS5ieXRlTGVuZ3RoKVxuICBpZiAoaXNJbnN0YW5jZShiLCBVaW50OEFycmF5KSkgYiA9IEJ1ZmZlci5mcm9tKGIsIGIub2Zmc2V0LCBiLmJ5dGVMZW5ndGgpXG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGEpIHx8ICFCdWZmZXIuaXNCdWZmZXIoYikpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgJ1RoZSBcImJ1ZjFcIiwgXCJidWYyXCIgYXJndW1lbnRzIG11c3QgYmUgb25lIG9mIHR5cGUgQnVmZmVyIG9yIFVpbnQ4QXJyYXknXG4gICAgKVxuICB9XG5cbiAgaWYgKGEgPT09IGIpIHJldHVybiAwXG5cbiAgdmFyIHggPSBhLmxlbmd0aFxuICB2YXIgeSA9IGIubGVuZ3RoXG5cbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IE1hdGgubWluKHgsIHkpOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAoYVtpXSAhPT0gYltpXSkge1xuICAgICAgeCA9IGFbaV1cbiAgICAgIHkgPSBiW2ldXG4gICAgICBicmVha1xuICAgIH1cbiAgfVxuXG4gIGlmICh4IDwgeSkgcmV0dXJuIC0xXG4gIGlmICh5IDwgeCkgcmV0dXJuIDFcbiAgcmV0dXJuIDBcbn1cblxuQnVmZmVyLmlzRW5jb2RpbmcgPSBmdW5jdGlvbiBpc0VuY29kaW5nIChlbmNvZGluZykge1xuICBzd2l0Y2ggKFN0cmluZyhlbmNvZGluZykudG9Mb3dlckNhc2UoKSkge1xuICAgIGNhc2UgJ2hleCc6XG4gICAgY2FzZSAndXRmOCc6XG4gICAgY2FzZSAndXRmLTgnOlxuICAgIGNhc2UgJ2FzY2lpJzpcbiAgICBjYXNlICdsYXRpbjEnOlxuICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgY2FzZSAnYmFzZTY0JzpcbiAgICBjYXNlICd1Y3MyJzpcbiAgICBjYXNlICd1Y3MtMic6XG4gICAgY2FzZSAndXRmMTZsZSc6XG4gICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgcmV0dXJuIHRydWVcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGZhbHNlXG4gIH1cbn1cblxuQnVmZmVyLmNvbmNhdCA9IGZ1bmN0aW9uIGNvbmNhdCAobGlzdCwgbGVuZ3RoKSB7XG4gIGlmICghQXJyYXkuaXNBcnJheShsaXN0KSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wibGlzdFwiIGFyZ3VtZW50IG11c3QgYmUgYW4gQXJyYXkgb2YgQnVmZmVycycpXG4gIH1cblxuICBpZiAobGlzdC5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gQnVmZmVyLmFsbG9jKDApXG4gIH1cblxuICB2YXIgaVxuICBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICBsZW5ndGggPSAwXG4gICAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyArK2kpIHtcbiAgICAgIGxlbmd0aCArPSBsaXN0W2ldLmxlbmd0aFxuICAgIH1cbiAgfVxuXG4gIHZhciBidWZmZXIgPSBCdWZmZXIuYWxsb2NVbnNhZmUobGVuZ3RoKVxuICB2YXIgcG9zID0gMFxuICBmb3IgKGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7ICsraSkge1xuICAgIHZhciBidWYgPSBsaXN0W2ldXG4gICAgaWYgKGlzSW5zdGFuY2UoYnVmLCBVaW50OEFycmF5KSkge1xuICAgICAgYnVmID0gQnVmZmVyLmZyb20oYnVmKVxuICAgIH1cbiAgICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihidWYpKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImxpc3RcIiBhcmd1bWVudCBtdXN0IGJlIGFuIEFycmF5IG9mIEJ1ZmZlcnMnKVxuICAgIH1cbiAgICBidWYuY29weShidWZmZXIsIHBvcylcbiAgICBwb3MgKz0gYnVmLmxlbmd0aFxuICB9XG4gIHJldHVybiBidWZmZXJcbn1cblxuZnVuY3Rpb24gYnl0ZUxlbmd0aCAoc3RyaW5nLCBlbmNvZGluZykge1xuICBpZiAoQnVmZmVyLmlzQnVmZmVyKHN0cmluZykpIHtcbiAgICByZXR1cm4gc3RyaW5nLmxlbmd0aFxuICB9XG4gIGlmIChBcnJheUJ1ZmZlci5pc1ZpZXcoc3RyaW5nKSB8fCBpc0luc3RhbmNlKHN0cmluZywgQXJyYXlCdWZmZXIpKSB7XG4gICAgcmV0dXJuIHN0cmluZy5ieXRlTGVuZ3RoXG4gIH1cbiAgaWYgKHR5cGVvZiBzdHJpbmcgIT09ICdzdHJpbmcnKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICdUaGUgXCJzdHJpbmdcIiBhcmd1bWVudCBtdXN0IGJlIG9uZSBvZiB0eXBlIHN0cmluZywgQnVmZmVyLCBvciBBcnJheUJ1ZmZlci4gJyArXG4gICAgICAnUmVjZWl2ZWQgdHlwZSAnICsgdHlwZW9mIHN0cmluZ1xuICAgIClcbiAgfVxuXG4gIHZhciBsZW4gPSBzdHJpbmcubGVuZ3RoXG4gIHZhciBtdXN0TWF0Y2ggPSAoYXJndW1lbnRzLmxlbmd0aCA+IDIgJiYgYXJndW1lbnRzWzJdID09PSB0cnVlKVxuICBpZiAoIW11c3RNYXRjaCAmJiBsZW4gPT09IDApIHJldHVybiAwXG5cbiAgLy8gVXNlIGEgZm9yIGxvb3AgdG8gYXZvaWQgcmVjdXJzaW9uXG4gIHZhciBsb3dlcmVkQ2FzZSA9IGZhbHNlXG4gIGZvciAoOzspIHtcbiAgICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICBjYXNlICdsYXRpbjEnOlxuICAgICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgICAgcmV0dXJuIGxlblxuICAgICAgY2FzZSAndXRmOCc6XG4gICAgICBjYXNlICd1dGYtOCc6XG4gICAgICAgIHJldHVybiB1dGY4VG9CeXRlcyhzdHJpbmcpLmxlbmd0aFxuICAgICAgY2FzZSAndWNzMic6XG4gICAgICBjYXNlICd1Y3MtMic6XG4gICAgICBjYXNlICd1dGYxNmxlJzpcbiAgICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgICAgcmV0dXJuIGxlbiAqIDJcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBsZW4gPj4+IDFcbiAgICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICAgIHJldHVybiBiYXNlNjRUb0J5dGVzKHN0cmluZykubGVuZ3RoXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAobG93ZXJlZENhc2UpIHtcbiAgICAgICAgICByZXR1cm4gbXVzdE1hdGNoID8gLTEgOiB1dGY4VG9CeXRlcyhzdHJpbmcpLmxlbmd0aCAvLyBhc3N1bWUgdXRmOFxuICAgICAgICB9XG4gICAgICAgIGVuY29kaW5nID0gKCcnICsgZW5jb2RpbmcpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlXG4gICAgfVxuICB9XG59XG5CdWZmZXIuYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGhcblxuZnVuY3Rpb24gc2xvd1RvU3RyaW5nIChlbmNvZGluZywgc3RhcnQsIGVuZCkge1xuICB2YXIgbG93ZXJlZENhc2UgPSBmYWxzZVxuXG4gIC8vIE5vIG5lZWQgdG8gdmVyaWZ5IHRoYXQgXCJ0aGlzLmxlbmd0aCA8PSBNQVhfVUlOVDMyXCIgc2luY2UgaXQncyBhIHJlYWQtb25seVxuICAvLyBwcm9wZXJ0eSBvZiBhIHR5cGVkIGFycmF5LlxuXG4gIC8vIFRoaXMgYmVoYXZlcyBuZWl0aGVyIGxpa2UgU3RyaW5nIG5vciBVaW50OEFycmF5IGluIHRoYXQgd2Ugc2V0IHN0YXJ0L2VuZFxuICAvLyB0byB0aGVpciB1cHBlci9sb3dlciBib3VuZHMgaWYgdGhlIHZhbHVlIHBhc3NlZCBpcyBvdXQgb2YgcmFuZ2UuXG4gIC8vIHVuZGVmaW5lZCBpcyBoYW5kbGVkIHNwZWNpYWxseSBhcyBwZXIgRUNNQS0yNjIgNnRoIEVkaXRpb24sXG4gIC8vIFNlY3Rpb24gMTMuMy4zLjcgUnVudGltZSBTZW1hbnRpY3M6IEtleWVkQmluZGluZ0luaXRpYWxpemF0aW9uLlxuICBpZiAoc3RhcnQgPT09IHVuZGVmaW5lZCB8fCBzdGFydCA8IDApIHtcbiAgICBzdGFydCA9IDBcbiAgfVxuICAvLyBSZXR1cm4gZWFybHkgaWYgc3RhcnQgPiB0aGlzLmxlbmd0aC4gRG9uZSBoZXJlIHRvIHByZXZlbnQgcG90ZW50aWFsIHVpbnQzMlxuICAvLyBjb2VyY2lvbiBmYWlsIGJlbG93LlxuICBpZiAoc3RhcnQgPiB0aGlzLmxlbmd0aCkge1xuICAgIHJldHVybiAnJ1xuICB9XG5cbiAgaWYgKGVuZCA9PT0gdW5kZWZpbmVkIHx8IGVuZCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgZW5kID0gdGhpcy5sZW5ndGhcbiAgfVxuXG4gIGlmIChlbmQgPD0gMCkge1xuICAgIHJldHVybiAnJ1xuICB9XG5cbiAgLy8gRm9yY2UgY29lcnNpb24gdG8gdWludDMyLiBUaGlzIHdpbGwgYWxzbyBjb2VyY2UgZmFsc2V5L05hTiB2YWx1ZXMgdG8gMC5cbiAgZW5kID4+Pj0gMFxuICBzdGFydCA+Pj49IDBcblxuICBpZiAoZW5kIDw9IHN0YXJ0KSB7XG4gICAgcmV0dXJuICcnXG4gIH1cblxuICBpZiAoIWVuY29kaW5nKSBlbmNvZGluZyA9ICd1dGY4J1xuXG4gIHdoaWxlICh0cnVlKSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnaGV4JzpcbiAgICAgICAgcmV0dXJuIGhleFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gdXRmOFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgICAgcmV0dXJuIGFzY2lpU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnbGF0aW4xJzpcbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAgIHJldHVybiBsYXRpbjFTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICByZXR1cm4gYmFzZTY0U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAndWNzMic6XG4gICAgICBjYXNlICd1Y3MtMic6XG4gICAgICBjYXNlICd1dGYxNmxlJzpcbiAgICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgICAgcmV0dXJuIHV0ZjE2bGVTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAobG93ZXJlZENhc2UpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgICAgICAgZW5jb2RpbmcgPSAoZW5jb2RpbmcgKyAnJykudG9Mb3dlckNhc2UoKVxuICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cblxuLy8gVGhpcyBwcm9wZXJ0eSBpcyB1c2VkIGJ5IGBCdWZmZXIuaXNCdWZmZXJgIChhbmQgdGhlIGBpcy1idWZmZXJgIG5wbSBwYWNrYWdlKVxuLy8gdG8gZGV0ZWN0IGEgQnVmZmVyIGluc3RhbmNlLiBJdCdzIG5vdCBwb3NzaWJsZSB0byB1c2UgYGluc3RhbmNlb2YgQnVmZmVyYFxuLy8gcmVsaWFibHkgaW4gYSBicm93c2VyaWZ5IGNvbnRleHQgYmVjYXVzZSB0aGVyZSBjb3VsZCBiZSBtdWx0aXBsZSBkaWZmZXJlbnRcbi8vIGNvcGllcyBvZiB0aGUgJ2J1ZmZlcicgcGFja2FnZSBpbiB1c2UuIFRoaXMgbWV0aG9kIHdvcmtzIGV2ZW4gZm9yIEJ1ZmZlclxuLy8gaW5zdGFuY2VzIHRoYXQgd2VyZSBjcmVhdGVkIGZyb20gYW5vdGhlciBjb3B5IG9mIHRoZSBgYnVmZmVyYCBwYWNrYWdlLlxuLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlci9pc3N1ZXMvMTU0XG5CdWZmZXIucHJvdG90eXBlLl9pc0J1ZmZlciA9IHRydWVcblxuZnVuY3Rpb24gc3dhcCAoYiwgbiwgbSkge1xuICB2YXIgaSA9IGJbbl1cbiAgYltuXSA9IGJbbV1cbiAgYlttXSA9IGlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5zd2FwMTYgPSBmdW5jdGlvbiBzd2FwMTYgKCkge1xuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgaWYgKGxlbiAlIDIgIT09IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQnVmZmVyIHNpemUgbXVzdCBiZSBhIG11bHRpcGxlIG9mIDE2LWJpdHMnKVxuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpICs9IDIpIHtcbiAgICBzd2FwKHRoaXMsIGksIGkgKyAxKVxuICB9XG4gIHJldHVybiB0aGlzXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuc3dhcDMyID0gZnVuY3Rpb24gc3dhcDMyICgpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIGlmIChsZW4gJSA0ICE9PSAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0J1ZmZlciBzaXplIG11c3QgYmUgYSBtdWx0aXBsZSBvZiAzMi1iaXRzJylcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSArPSA0KSB7XG4gICAgc3dhcCh0aGlzLCBpLCBpICsgMylcbiAgICBzd2FwKHRoaXMsIGkgKyAxLCBpICsgMilcbiAgfVxuICByZXR1cm4gdGhpc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnN3YXA2NCA9IGZ1bmN0aW9uIHN3YXA2NCAoKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBpZiAobGVuICUgOCAhPT0gMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdCdWZmZXIgc2l6ZSBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgNjQtYml0cycpXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkgKz0gOCkge1xuICAgIHN3YXAodGhpcywgaSwgaSArIDcpXG4gICAgc3dhcCh0aGlzLCBpICsgMSwgaSArIDYpXG4gICAgc3dhcCh0aGlzLCBpICsgMiwgaSArIDUpXG4gICAgc3dhcCh0aGlzLCBpICsgMywgaSArIDQpXG4gIH1cbiAgcmV0dXJuIHRoaXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nICgpIHtcbiAgdmFyIGxlbmd0aCA9IHRoaXMubGVuZ3RoXG4gIGlmIChsZW5ndGggPT09IDApIHJldHVybiAnJ1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHV0ZjhTbGljZSh0aGlzLCAwLCBsZW5ndGgpXG4gIHJldHVybiBzbG93VG9TdHJpbmcuYXBwbHkodGhpcywgYXJndW1lbnRzKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvTG9jYWxlU3RyaW5nID0gQnVmZmVyLnByb3RvdHlwZS50b1N0cmluZ1xuXG5CdWZmZXIucHJvdG90eXBlLmVxdWFscyA9IGZ1bmN0aW9uIGVxdWFscyAoYikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihiKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlcicpXG4gIGlmICh0aGlzID09PSBiKSByZXR1cm4gdHJ1ZVxuICByZXR1cm4gQnVmZmVyLmNvbXBhcmUodGhpcywgYikgPT09IDBcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbnNwZWN0ID0gZnVuY3Rpb24gaW5zcGVjdCAoKSB7XG4gIHZhciBzdHIgPSAnJ1xuICB2YXIgbWF4ID0gZXhwb3J0cy5JTlNQRUNUX01BWF9CWVRFU1xuICBzdHIgPSB0aGlzLnRvU3RyaW5nKCdoZXgnLCAwLCBtYXgpLnJlcGxhY2UoLyguezJ9KS9nLCAnJDEgJykudHJpbSgpXG4gIGlmICh0aGlzLmxlbmd0aCA+IG1heCkgc3RyICs9ICcgLi4uICdcbiAgcmV0dXJuICc8QnVmZmVyICcgKyBzdHIgKyAnPidcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5jb21wYXJlID0gZnVuY3Rpb24gY29tcGFyZSAodGFyZ2V0LCBzdGFydCwgZW5kLCB0aGlzU3RhcnQsIHRoaXNFbmQpIHtcbiAgaWYgKGlzSW5zdGFuY2UodGFyZ2V0LCBVaW50OEFycmF5KSkge1xuICAgIHRhcmdldCA9IEJ1ZmZlci5mcm9tKHRhcmdldCwgdGFyZ2V0Lm9mZnNldCwgdGFyZ2V0LmJ5dGVMZW5ndGgpXG4gIH1cbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIodGFyZ2V0KSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAnVGhlIFwidGFyZ2V0XCIgYXJndW1lbnQgbXVzdCBiZSBvbmUgb2YgdHlwZSBCdWZmZXIgb3IgVWludDhBcnJheS4gJyArXG4gICAgICAnUmVjZWl2ZWQgdHlwZSAnICsgKHR5cGVvZiB0YXJnZXQpXG4gICAgKVxuICB9XG5cbiAgaWYgKHN0YXJ0ID09PSB1bmRlZmluZWQpIHtcbiAgICBzdGFydCA9IDBcbiAgfVxuICBpZiAoZW5kID09PSB1bmRlZmluZWQpIHtcbiAgICBlbmQgPSB0YXJnZXQgPyB0YXJnZXQubGVuZ3RoIDogMFxuICB9XG4gIGlmICh0aGlzU3RhcnQgPT09IHVuZGVmaW5lZCkge1xuICAgIHRoaXNTdGFydCA9IDBcbiAgfVxuICBpZiAodGhpc0VuZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhpc0VuZCA9IHRoaXMubGVuZ3RoXG4gIH1cblxuICBpZiAoc3RhcnQgPCAwIHx8IGVuZCA+IHRhcmdldC5sZW5ndGggfHwgdGhpc1N0YXJ0IDwgMCB8fCB0aGlzRW5kID4gdGhpcy5sZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignb3V0IG9mIHJhbmdlIGluZGV4JylcbiAgfVxuXG4gIGlmICh0aGlzU3RhcnQgPj0gdGhpc0VuZCAmJiBzdGFydCA+PSBlbmQpIHtcbiAgICByZXR1cm4gMFxuICB9XG4gIGlmICh0aGlzU3RhcnQgPj0gdGhpc0VuZCkge1xuICAgIHJldHVybiAtMVxuICB9XG4gIGlmIChzdGFydCA+PSBlbmQpIHtcbiAgICByZXR1cm4gMVxuICB9XG5cbiAgc3RhcnQgPj4+PSAwXG4gIGVuZCA+Pj49IDBcbiAgdGhpc1N0YXJ0ID4+Pj0gMFxuICB0aGlzRW5kID4+Pj0gMFxuXG4gIGlmICh0aGlzID09PSB0YXJnZXQpIHJldHVybiAwXG5cbiAgdmFyIHggPSB0aGlzRW5kIC0gdGhpc1N0YXJ0XG4gIHZhciB5ID0gZW5kIC0gc3RhcnRcbiAgdmFyIGxlbiA9IE1hdGgubWluKHgsIHkpXG5cbiAgdmFyIHRoaXNDb3B5ID0gdGhpcy5zbGljZSh0aGlzU3RhcnQsIHRoaXNFbmQpXG4gIHZhciB0YXJnZXRDb3B5ID0gdGFyZ2V0LnNsaWNlKHN0YXJ0LCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSkge1xuICAgIGlmICh0aGlzQ29weVtpXSAhPT0gdGFyZ2V0Q29weVtpXSkge1xuICAgICAgeCA9IHRoaXNDb3B5W2ldXG4gICAgICB5ID0gdGFyZ2V0Q29weVtpXVxuICAgICAgYnJlYWtcbiAgICB9XG4gIH1cblxuICBpZiAoeCA8IHkpIHJldHVybiAtMVxuICBpZiAoeSA8IHgpIHJldHVybiAxXG4gIHJldHVybiAwXG59XG5cbi8vIEZpbmRzIGVpdGhlciB0aGUgZmlyc3QgaW5kZXggb2YgYHZhbGAgaW4gYGJ1ZmZlcmAgYXQgb2Zmc2V0ID49IGBieXRlT2Zmc2V0YCxcbi8vIE9SIHRoZSBsYXN0IGluZGV4IG9mIGB2YWxgIGluIGBidWZmZXJgIGF0IG9mZnNldCA8PSBgYnl0ZU9mZnNldGAuXG4vL1xuLy8gQXJndW1lbnRzOlxuLy8gLSBidWZmZXIgLSBhIEJ1ZmZlciB0byBzZWFyY2hcbi8vIC0gdmFsIC0gYSBzdHJpbmcsIEJ1ZmZlciwgb3IgbnVtYmVyXG4vLyAtIGJ5dGVPZmZzZXQgLSBhbiBpbmRleCBpbnRvIGBidWZmZXJgOyB3aWxsIGJlIGNsYW1wZWQgdG8gYW4gaW50MzJcbi8vIC0gZW5jb2RpbmcgLSBhbiBvcHRpb25hbCBlbmNvZGluZywgcmVsZXZhbnQgaXMgdmFsIGlzIGEgc3RyaW5nXG4vLyAtIGRpciAtIHRydWUgZm9yIGluZGV4T2YsIGZhbHNlIGZvciBsYXN0SW5kZXhPZlxuZnVuY3Rpb24gYmlkaXJlY3Rpb25hbEluZGV4T2YgKGJ1ZmZlciwgdmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgZGlyKSB7XG4gIC8vIEVtcHR5IGJ1ZmZlciBtZWFucyBubyBtYXRjaFxuICBpZiAoYnVmZmVyLmxlbmd0aCA9PT0gMCkgcmV0dXJuIC0xXG5cbiAgLy8gTm9ybWFsaXplIGJ5dGVPZmZzZXRcbiAgaWYgKHR5cGVvZiBieXRlT2Zmc2V0ID09PSAnc3RyaW5nJykge1xuICAgIGVuY29kaW5nID0gYnl0ZU9mZnNldFxuICAgIGJ5dGVPZmZzZXQgPSAwXG4gIH0gZWxzZSBpZiAoYnl0ZU9mZnNldCA+IDB4N2ZmZmZmZmYpIHtcbiAgICBieXRlT2Zmc2V0ID0gMHg3ZmZmZmZmZlxuICB9IGVsc2UgaWYgKGJ5dGVPZmZzZXQgPCAtMHg4MDAwMDAwMCkge1xuICAgIGJ5dGVPZmZzZXQgPSAtMHg4MDAwMDAwMFxuICB9XG4gIGJ5dGVPZmZzZXQgPSArYnl0ZU9mZnNldCAvLyBDb2VyY2UgdG8gTnVtYmVyLlxuICBpZiAobnVtYmVySXNOYU4oYnl0ZU9mZnNldCkpIHtcbiAgICAvLyBieXRlT2Zmc2V0OiBpdCBpdCdzIHVuZGVmaW5lZCwgbnVsbCwgTmFOLCBcImZvb1wiLCBldGMsIHNlYXJjaCB3aG9sZSBidWZmZXJcbiAgICBieXRlT2Zmc2V0ID0gZGlyID8gMCA6IChidWZmZXIubGVuZ3RoIC0gMSlcbiAgfVxuXG4gIC8vIE5vcm1hbGl6ZSBieXRlT2Zmc2V0OiBuZWdhdGl2ZSBvZmZzZXRzIHN0YXJ0IGZyb20gdGhlIGVuZCBvZiB0aGUgYnVmZmVyXG4gIGlmIChieXRlT2Zmc2V0IDwgMCkgYnl0ZU9mZnNldCA9IGJ1ZmZlci5sZW5ndGggKyBieXRlT2Zmc2V0XG4gIGlmIChieXRlT2Zmc2V0ID49IGJ1ZmZlci5sZW5ndGgpIHtcbiAgICBpZiAoZGlyKSByZXR1cm4gLTFcbiAgICBlbHNlIGJ5dGVPZmZzZXQgPSBidWZmZXIubGVuZ3RoIC0gMVxuICB9IGVsc2UgaWYgKGJ5dGVPZmZzZXQgPCAwKSB7XG4gICAgaWYgKGRpcikgYnl0ZU9mZnNldCA9IDBcbiAgICBlbHNlIHJldHVybiAtMVxuICB9XG5cbiAgLy8gTm9ybWFsaXplIHZhbFxuICBpZiAodHlwZW9mIHZhbCA9PT0gJ3N0cmluZycpIHtcbiAgICB2YWwgPSBCdWZmZXIuZnJvbSh2YWwsIGVuY29kaW5nKVxuICB9XG5cbiAgLy8gRmluYWxseSwgc2VhcmNoIGVpdGhlciBpbmRleE9mIChpZiBkaXIgaXMgdHJ1ZSkgb3IgbGFzdEluZGV4T2ZcbiAgaWYgKEJ1ZmZlci5pc0J1ZmZlcih2YWwpKSB7XG4gICAgLy8gU3BlY2lhbCBjYXNlOiBsb29raW5nIGZvciBlbXB0eSBzdHJpbmcvYnVmZmVyIGFsd2F5cyBmYWlsc1xuICAgIGlmICh2YWwubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gLTFcbiAgICB9XG4gICAgcmV0dXJuIGFycmF5SW5kZXhPZihidWZmZXIsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGRpcilcbiAgfSBlbHNlIGlmICh0eXBlb2YgdmFsID09PSAnbnVtYmVyJykge1xuICAgIHZhbCA9IHZhbCAmIDB4RkYgLy8gU2VhcmNoIGZvciBhIGJ5dGUgdmFsdWUgWzAtMjU1XVxuICAgIGlmICh0eXBlb2YgVWludDhBcnJheS5wcm90b3R5cGUuaW5kZXhPZiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgaWYgKGRpcikge1xuICAgICAgICByZXR1cm4gVWludDhBcnJheS5wcm90b3R5cGUuaW5kZXhPZi5jYWxsKGJ1ZmZlciwgdmFsLCBieXRlT2Zmc2V0KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFVpbnQ4QXJyYXkucHJvdG90eXBlLmxhc3RJbmRleE9mLmNhbGwoYnVmZmVyLCB2YWwsIGJ5dGVPZmZzZXQpXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhcnJheUluZGV4T2YoYnVmZmVyLCBbIHZhbCBdLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgZGlyKVxuICB9XG5cbiAgdGhyb3cgbmV3IFR5cGVFcnJvcigndmFsIG11c3QgYmUgc3RyaW5nLCBudW1iZXIgb3IgQnVmZmVyJylcbn1cblxuZnVuY3Rpb24gYXJyYXlJbmRleE9mIChhcnIsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGRpcikge1xuICB2YXIgaW5kZXhTaXplID0gMVxuICB2YXIgYXJyTGVuZ3RoID0gYXJyLmxlbmd0aFxuICB2YXIgdmFsTGVuZ3RoID0gdmFsLmxlbmd0aFxuXG4gIGlmIChlbmNvZGluZyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgZW5jb2RpbmcgPSBTdHJpbmcoZW5jb2RpbmcpLnRvTG93ZXJDYXNlKClcbiAgICBpZiAoZW5jb2RpbmcgPT09ICd1Y3MyJyB8fCBlbmNvZGluZyA9PT0gJ3Vjcy0yJyB8fFxuICAgICAgICBlbmNvZGluZyA9PT0gJ3V0ZjE2bGUnIHx8IGVuY29kaW5nID09PSAndXRmLTE2bGUnKSB7XG4gICAgICBpZiAoYXJyLmxlbmd0aCA8IDIgfHwgdmFsLmxlbmd0aCA8IDIpIHtcbiAgICAgICAgcmV0dXJuIC0xXG4gICAgICB9XG4gICAgICBpbmRleFNpemUgPSAyXG4gICAgICBhcnJMZW5ndGggLz0gMlxuICAgICAgdmFsTGVuZ3RoIC89IDJcbiAgICAgIGJ5dGVPZmZzZXQgLz0gMlxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWQgKGJ1ZiwgaSkge1xuICAgIGlmIChpbmRleFNpemUgPT09IDEpIHtcbiAgICAgIHJldHVybiBidWZbaV1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGJ1Zi5yZWFkVUludDE2QkUoaSAqIGluZGV4U2l6ZSlcbiAgICB9XG4gIH1cblxuICB2YXIgaVxuICBpZiAoZGlyKSB7XG4gICAgdmFyIGZvdW5kSW5kZXggPSAtMVxuICAgIGZvciAoaSA9IGJ5dGVPZmZzZXQ7IGkgPCBhcnJMZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHJlYWQoYXJyLCBpKSA9PT0gcmVhZCh2YWwsIGZvdW5kSW5kZXggPT09IC0xID8gMCA6IGkgLSBmb3VuZEluZGV4KSkge1xuICAgICAgICBpZiAoZm91bmRJbmRleCA9PT0gLTEpIGZvdW5kSW5kZXggPSBpXG4gICAgICAgIGlmIChpIC0gZm91bmRJbmRleCArIDEgPT09IHZhbExlbmd0aCkgcmV0dXJuIGZvdW5kSW5kZXggKiBpbmRleFNpemVcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChmb3VuZEluZGV4ICE9PSAtMSkgaSAtPSBpIC0gZm91bmRJbmRleFxuICAgICAgICBmb3VuZEluZGV4ID0gLTFcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGJ5dGVPZmZzZXQgKyB2YWxMZW5ndGggPiBhcnJMZW5ndGgpIGJ5dGVPZmZzZXQgPSBhcnJMZW5ndGggLSB2YWxMZW5ndGhcbiAgICBmb3IgKGkgPSBieXRlT2Zmc2V0OyBpID49IDA7IGktLSkge1xuICAgICAgdmFyIGZvdW5kID0gdHJ1ZVxuICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB2YWxMZW5ndGg7IGorKykge1xuICAgICAgICBpZiAocmVhZChhcnIsIGkgKyBqKSAhPT0gcmVhZCh2YWwsIGopKSB7XG4gICAgICAgICAgZm91bmQgPSBmYWxzZVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChmb3VuZCkgcmV0dXJuIGlcbiAgICB9XG4gIH1cblxuICByZXR1cm4gLTFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbmNsdWRlcyA9IGZ1bmN0aW9uIGluY2x1ZGVzICh2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nKSB7XG4gIHJldHVybiB0aGlzLmluZGV4T2YodmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZykgIT09IC0xXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5kZXhPZiA9IGZ1bmN0aW9uIGluZGV4T2YgKHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcpIHtcbiAgcmV0dXJuIGJpZGlyZWN0aW9uYWxJbmRleE9mKHRoaXMsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIHRydWUpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUubGFzdEluZGV4T2YgPSBmdW5jdGlvbiBsYXN0SW5kZXhPZiAodmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZykge1xuICByZXR1cm4gYmlkaXJlY3Rpb25hbEluZGV4T2YodGhpcywgdmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgZmFsc2UpXG59XG5cbmZ1bmN0aW9uIGhleFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgb2Zmc2V0ID0gTnVtYmVyKG9mZnNldCkgfHwgMFxuICB2YXIgcmVtYWluaW5nID0gYnVmLmxlbmd0aCAtIG9mZnNldFxuICBpZiAoIWxlbmd0aCkge1xuICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICB9IGVsc2Uge1xuICAgIGxlbmd0aCA9IE51bWJlcihsZW5ndGgpXG4gICAgaWYgKGxlbmd0aCA+IHJlbWFpbmluZykge1xuICAgICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gICAgfVxuICB9XG5cbiAgdmFyIHN0ckxlbiA9IHN0cmluZy5sZW5ndGhcblxuICBpZiAobGVuZ3RoID4gc3RyTGVuIC8gMikge1xuICAgIGxlbmd0aCA9IHN0ckxlbiAvIDJcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgKytpKSB7XG4gICAgdmFyIHBhcnNlZCA9IHBhcnNlSW50KHN0cmluZy5zdWJzdHIoaSAqIDIsIDIpLCAxNilcbiAgICBpZiAobnVtYmVySXNOYU4ocGFyc2VkKSkgcmV0dXJuIGlcbiAgICBidWZbb2Zmc2V0ICsgaV0gPSBwYXJzZWRcbiAgfVxuICByZXR1cm4gaVxufVxuXG5mdW5jdGlvbiB1dGY4V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcih1dGY4VG9CeXRlcyhzdHJpbmcsIGJ1Zi5sZW5ndGggLSBvZmZzZXQpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBhc2NpaVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIoYXNjaWlUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIGxhdGluMVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGFzY2lpV3JpdGUoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBiYXNlNjRXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKGJhc2U2NFRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gdWNzMldyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIodXRmMTZsZVRvQnl0ZXMoc3RyaW5nLCBidWYubGVuZ3RoIC0gb2Zmc2V0KSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZSA9IGZ1bmN0aW9uIHdyaXRlIChzdHJpbmcsIG9mZnNldCwgbGVuZ3RoLCBlbmNvZGluZykge1xuICAvLyBCdWZmZXIjd3JpdGUoc3RyaW5nKVxuICBpZiAob2Zmc2V0ID09PSB1bmRlZmluZWQpIHtcbiAgICBlbmNvZGluZyA9ICd1dGY4J1xuICAgIGxlbmd0aCA9IHRoaXMubGVuZ3RoXG4gICAgb2Zmc2V0ID0gMFxuICAvLyBCdWZmZXIjd3JpdGUoc3RyaW5nLCBlbmNvZGluZylcbiAgfSBlbHNlIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCAmJiB0eXBlb2Ygb2Zmc2V0ID09PSAnc3RyaW5nJykge1xuICAgIGVuY29kaW5nID0gb2Zmc2V0XG4gICAgbGVuZ3RoID0gdGhpcy5sZW5ndGhcbiAgICBvZmZzZXQgPSAwXG4gIC8vIEJ1ZmZlciN3cml0ZShzdHJpbmcsIG9mZnNldFssIGxlbmd0aF1bLCBlbmNvZGluZ10pXG4gIH0gZWxzZSBpZiAoaXNGaW5pdGUob2Zmc2V0KSkge1xuICAgIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICAgIGlmIChpc0Zpbml0ZShsZW5ndGgpKSB7XG4gICAgICBsZW5ndGggPSBsZW5ndGggPj4+IDBcbiAgICAgIGlmIChlbmNvZGluZyA9PT0gdW5kZWZpbmVkKSBlbmNvZGluZyA9ICd1dGY4J1xuICAgIH0gZWxzZSB7XG4gICAgICBlbmNvZGluZyA9IGxlbmd0aFxuICAgICAgbGVuZ3RoID0gdW5kZWZpbmVkXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICdCdWZmZXIud3JpdGUoc3RyaW5nLCBlbmNvZGluZywgb2Zmc2V0WywgbGVuZ3RoXSkgaXMgbm8gbG9uZ2VyIHN1cHBvcnRlZCdcbiAgICApXG4gIH1cblxuICB2YXIgcmVtYWluaW5nID0gdGhpcy5sZW5ndGggLSBvZmZzZXRcbiAgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkIHx8IGxlbmd0aCA+IHJlbWFpbmluZykgbGVuZ3RoID0gcmVtYWluaW5nXG5cbiAgaWYgKChzdHJpbmcubGVuZ3RoID4gMCAmJiAobGVuZ3RoIDwgMCB8fCBvZmZzZXQgPCAwKSkgfHwgb2Zmc2V0ID4gdGhpcy5sZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQXR0ZW1wdCB0byB3cml0ZSBvdXRzaWRlIGJ1ZmZlciBib3VuZHMnKVxuICB9XG5cbiAgaWYgKCFlbmNvZGluZykgZW5jb2RpbmcgPSAndXRmOCdcblxuICB2YXIgbG93ZXJlZENhc2UgPSBmYWxzZVxuICBmb3IgKDs7KSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnaGV4JzpcbiAgICAgICAgcmV0dXJuIGhleFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gdXRmOFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgICAgcmV0dXJuIGFzY2lpV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAnbGF0aW4xJzpcbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAgIHJldHVybiBsYXRpbjFXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICAvLyBXYXJuaW5nOiBtYXhMZW5ndGggbm90IHRha2VuIGludG8gYWNjb3VudCBpbiBiYXNlNjRXcml0ZVxuICAgICAgICByZXR1cm4gYmFzZTY0V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAndWNzMic6XG4gICAgICBjYXNlICd1Y3MtMic6XG4gICAgICBjYXNlICd1dGYxNmxlJzpcbiAgICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgICAgcmV0dXJuIHVjczJXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAobG93ZXJlZENhc2UpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgICAgICAgZW5jb2RpbmcgPSAoJycgKyBlbmNvZGluZykudG9Mb3dlckNhc2UoKVxuICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbiB0b0pTT04gKCkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6ICdCdWZmZXInLFxuICAgIGRhdGE6IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHRoaXMuX2FyciB8fCB0aGlzLCAwKVxuICB9XG59XG5cbmZ1bmN0aW9uIGJhc2U2NFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKHN0YXJ0ID09PSAwICYmIGVuZCA9PT0gYnVmLmxlbmd0aCkge1xuICAgIHJldHVybiBiYXNlNjQuZnJvbUJ5dGVBcnJheShidWYpXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGJhc2U2NC5mcm9tQnl0ZUFycmF5KGJ1Zi5zbGljZShzdGFydCwgZW5kKSlcbiAgfVxufVxuXG5mdW5jdGlvbiB1dGY4U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG4gIHZhciByZXMgPSBbXVxuXG4gIHZhciBpID0gc3RhcnRcbiAgd2hpbGUgKGkgPCBlbmQpIHtcbiAgICB2YXIgZmlyc3RCeXRlID0gYnVmW2ldXG4gICAgdmFyIGNvZGVQb2ludCA9IG51bGxcbiAgICB2YXIgYnl0ZXNQZXJTZXF1ZW5jZSA9IChmaXJzdEJ5dGUgPiAweEVGKSA/IDRcbiAgICAgIDogKGZpcnN0Qnl0ZSA+IDB4REYpID8gM1xuICAgICAgICA6IChmaXJzdEJ5dGUgPiAweEJGKSA/IDJcbiAgICAgICAgICA6IDFcblxuICAgIGlmIChpICsgYnl0ZXNQZXJTZXF1ZW5jZSA8PSBlbmQpIHtcbiAgICAgIHZhciBzZWNvbmRCeXRlLCB0aGlyZEJ5dGUsIGZvdXJ0aEJ5dGUsIHRlbXBDb2RlUG9pbnRcblxuICAgICAgc3dpdGNoIChieXRlc1BlclNlcXVlbmNlKSB7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICBpZiAoZmlyc3RCeXRlIDwgMHg4MCkge1xuICAgICAgICAgICAgY29kZVBvaW50ID0gZmlyc3RCeXRlXG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4MUYpIDw8IDB4NiB8IChzZWNvbmRCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHg3Rikge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgMzpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIHRoaXJkQnl0ZSA9IGJ1ZltpICsgMl1cbiAgICAgICAgICBpZiAoKHNlY29uZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAodGhpcmRCeXRlICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICAgIHRlbXBDb2RlUG9pbnQgPSAoZmlyc3RCeXRlICYgMHhGKSA8PCAweEMgfCAoc2Vjb25kQnl0ZSAmIDB4M0YpIDw8IDB4NiB8ICh0aGlyZEJ5dGUgJiAweDNGKVxuICAgICAgICAgICAgaWYgKHRlbXBDb2RlUG9pbnQgPiAweDdGRiAmJiAodGVtcENvZGVQb2ludCA8IDB4RDgwMCB8fCB0ZW1wQ29kZVBvaW50ID4gMHhERkZGKSkge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgNDpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIHRoaXJkQnl0ZSA9IGJ1ZltpICsgMl1cbiAgICAgICAgICBmb3VydGhCeXRlID0gYnVmW2kgKyAzXVxuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4QzApID09PSAweDgwICYmICh0aGlyZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAoZm91cnRoQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4RikgPDwgMHgxMiB8IChzZWNvbmRCeXRlICYgMHgzRikgPDwgMHhDIHwgKHRoaXJkQnl0ZSAmIDB4M0YpIDw8IDB4NiB8IChmb3VydGhCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHhGRkZGICYmIHRlbXBDb2RlUG9pbnQgPCAweDExMDAwMCkge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChjb2RlUG9pbnQgPT09IG51bGwpIHtcbiAgICAgIC8vIHdlIGRpZCBub3QgZ2VuZXJhdGUgYSB2YWxpZCBjb2RlUG9pbnQgc28gaW5zZXJ0IGFcbiAgICAgIC8vIHJlcGxhY2VtZW50IGNoYXIgKFUrRkZGRCkgYW5kIGFkdmFuY2Ugb25seSAxIGJ5dGVcbiAgICAgIGNvZGVQb2ludCA9IDB4RkZGRFxuICAgICAgYnl0ZXNQZXJTZXF1ZW5jZSA9IDFcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA+IDB4RkZGRikge1xuICAgICAgLy8gZW5jb2RlIHRvIHV0ZjE2IChzdXJyb2dhdGUgcGFpciBkYW5jZSlcbiAgICAgIGNvZGVQb2ludCAtPSAweDEwMDAwXG4gICAgICByZXMucHVzaChjb2RlUG9pbnQgPj4+IDEwICYgMHgzRkYgfCAweEQ4MDApXG4gICAgICBjb2RlUG9pbnQgPSAweERDMDAgfCBjb2RlUG9pbnQgJiAweDNGRlxuICAgIH1cblxuICAgIHJlcy5wdXNoKGNvZGVQb2ludClcbiAgICBpICs9IGJ5dGVzUGVyU2VxdWVuY2VcbiAgfVxuXG4gIHJldHVybiBkZWNvZGVDb2RlUG9pbnRzQXJyYXkocmVzKVxufVxuXG4vLyBCYXNlZCBvbiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8yMjc0NzI3Mi82ODA3NDIsIHRoZSBicm93c2VyIHdpdGhcbi8vIHRoZSBsb3dlc3QgbGltaXQgaXMgQ2hyb21lLCB3aXRoIDB4MTAwMDAgYXJncy5cbi8vIFdlIGdvIDEgbWFnbml0dWRlIGxlc3MsIGZvciBzYWZldHlcbnZhciBNQVhfQVJHVU1FTlRTX0xFTkdUSCA9IDB4MTAwMFxuXG5mdW5jdGlvbiBkZWNvZGVDb2RlUG9pbnRzQXJyYXkgKGNvZGVQb2ludHMpIHtcbiAgdmFyIGxlbiA9IGNvZGVQb2ludHMubGVuZ3RoXG4gIGlmIChsZW4gPD0gTUFYX0FSR1VNRU5UU19MRU5HVEgpIHtcbiAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShTdHJpbmcsIGNvZGVQb2ludHMpIC8vIGF2b2lkIGV4dHJhIHNsaWNlKClcbiAgfVxuXG4gIC8vIERlY29kZSBpbiBjaHVua3MgdG8gYXZvaWQgXCJjYWxsIHN0YWNrIHNpemUgZXhjZWVkZWRcIi5cbiAgdmFyIHJlcyA9ICcnXG4gIHZhciBpID0gMFxuICB3aGlsZSAoaSA8IGxlbikge1xuICAgIHJlcyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KFxuICAgICAgU3RyaW5nLFxuICAgICAgY29kZVBvaW50cy5zbGljZShpLCBpICs9IE1BWF9BUkdVTUVOVFNfTEVOR1RIKVxuICAgIClcbiAgfVxuICByZXR1cm4gcmVzXG59XG5cbmZ1bmN0aW9uIGFzY2lpU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgcmV0ID0gJydcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgKytpKSB7XG4gICAgcmV0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldICYgMHg3RilcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbmZ1bmN0aW9uIGxhdGluMVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHJldCA9ICcnXG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcblxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7ICsraSkge1xuICAgIHJldCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSlcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbmZ1bmN0aW9uIGhleFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcblxuICBpZiAoIXN0YXJ0IHx8IHN0YXJ0IDwgMCkgc3RhcnQgPSAwXG4gIGlmICghZW5kIHx8IGVuZCA8IDAgfHwgZW5kID4gbGVuKSBlbmQgPSBsZW5cblxuICB2YXIgb3V0ID0gJydcbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyArK2kpIHtcbiAgICBvdXQgKz0gdG9IZXgoYnVmW2ldKVxuICB9XG4gIHJldHVybiBvdXRcbn1cblxuZnVuY3Rpb24gdXRmMTZsZVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGJ5dGVzID0gYnVmLnNsaWNlKHN0YXJ0LCBlbmQpXG4gIHZhciByZXMgPSAnJ1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGJ5dGVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgcmVzICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnl0ZXNbaV0gKyAoYnl0ZXNbaSArIDFdICogMjU2KSlcbiAgfVxuICByZXR1cm4gcmVzXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuc2xpY2UgPSBmdW5jdGlvbiBzbGljZSAoc3RhcnQsIGVuZCkge1xuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgc3RhcnQgPSB+fnN0YXJ0XG4gIGVuZCA9IGVuZCA9PT0gdW5kZWZpbmVkID8gbGVuIDogfn5lbmRcblxuICBpZiAoc3RhcnQgPCAwKSB7XG4gICAgc3RhcnQgKz0gbGVuXG4gICAgaWYgKHN0YXJ0IDwgMCkgc3RhcnQgPSAwXG4gIH0gZWxzZSBpZiAoc3RhcnQgPiBsZW4pIHtcbiAgICBzdGFydCA9IGxlblxuICB9XG5cbiAgaWYgKGVuZCA8IDApIHtcbiAgICBlbmQgKz0gbGVuXG4gICAgaWYgKGVuZCA8IDApIGVuZCA9IDBcbiAgfSBlbHNlIGlmIChlbmQgPiBsZW4pIHtcbiAgICBlbmQgPSBsZW5cbiAgfVxuXG4gIGlmIChlbmQgPCBzdGFydCkgZW5kID0gc3RhcnRcblxuICB2YXIgbmV3QnVmID0gdGhpcy5zdWJhcnJheShzdGFydCwgZW5kKVxuICAvLyBSZXR1cm4gYW4gYXVnbWVudGVkIGBVaW50OEFycmF5YCBpbnN0YW5jZVxuICBuZXdCdWYuX19wcm90b19fID0gQnVmZmVyLnByb3RvdHlwZVxuICByZXR1cm4gbmV3QnVmXG59XG5cbi8qXG4gKiBOZWVkIHRvIG1ha2Ugc3VyZSB0aGF0IGJ1ZmZlciBpc24ndCB0cnlpbmcgdG8gd3JpdGUgb3V0IG9mIGJvdW5kcy5cbiAqL1xuZnVuY3Rpb24gY2hlY2tPZmZzZXQgKG9mZnNldCwgZXh0LCBsZW5ndGgpIHtcbiAgaWYgKChvZmZzZXQgJSAxKSAhPT0gMCB8fCBvZmZzZXQgPCAwKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignb2Zmc2V0IGlzIG5vdCB1aW50JylcbiAgaWYgKG9mZnNldCArIGV4dCA+IGxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1RyeWluZyB0byBhY2Nlc3MgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50TEUgPSBmdW5jdGlvbiByZWFkVUludExFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldF1cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgaV0gKiBtdWxcbiAgfVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludEJFID0gZnVuY3Rpb24gcmVhZFVJbnRCRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG4gIH1cblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAtLWJ5dGVMZW5ndGhdXG4gIHZhciBtdWwgPSAxXG4gIHdoaWxlIChieXRlTGVuZ3RoID4gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIC0tYnl0ZUxlbmd0aF0gKiBtdWxcbiAgfVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDggPSBmdW5jdGlvbiByZWFkVUludDggKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMSwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiB0aGlzW29mZnNldF1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2TEUgPSBmdW5jdGlvbiByZWFkVUludDE2TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiB0aGlzW29mZnNldF0gfCAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MTZCRSA9IGZ1bmN0aW9uIHJlYWRVSW50MTZCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuICh0aGlzW29mZnNldF0gPDwgOCkgfCB0aGlzW29mZnNldCArIDFdXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQzMkxFID0gZnVuY3Rpb24gcmVhZFVJbnQzMkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAoKHRoaXNbb2Zmc2V0XSkgfFxuICAgICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOCkgfFxuICAgICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgMTYpKSArXG4gICAgICAodGhpc1tvZmZzZXQgKyAzXSAqIDB4MTAwMDAwMClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDMyQkUgPSBmdW5jdGlvbiByZWFkVUludDMyQkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0gKiAweDEwMDAwMDApICtcbiAgICAoKHRoaXNbb2Zmc2V0ICsgMV0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCA4KSB8XG4gICAgdGhpc1tvZmZzZXQgKyAzXSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50TEUgPSBmdW5jdGlvbiByZWFkSW50TEUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XVxuICB2YXIgbXVsID0gMVxuICB2YXIgaSA9IDBcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyBpXSAqIG11bFxuICB9XG4gIG11bCAqPSAweDgwXG5cbiAgaWYgKHZhbCA+PSBtdWwpIHZhbCAtPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aClcblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludEJFID0gZnVuY3Rpb24gcmVhZEludEJFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aFxuICB2YXIgbXVsID0gMVxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAtLWldXG4gIHdoaWxlIChpID4gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIC0taV0gKiBtdWxcbiAgfVxuICBtdWwgKj0gMHg4MFxuXG4gIGlmICh2YWwgPj0gbXVsKSB2YWwgLT0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpXG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQ4ID0gZnVuY3Rpb24gcmVhZEludDggKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMSwgdGhpcy5sZW5ndGgpXG4gIGlmICghKHRoaXNbb2Zmc2V0XSAmIDB4ODApKSByZXR1cm4gKHRoaXNbb2Zmc2V0XSlcbiAgcmV0dXJuICgoMHhmZiAtIHRoaXNbb2Zmc2V0XSArIDEpICogLTEpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDE2TEUgPSBmdW5jdGlvbiByZWFkSW50MTZMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XSB8ICh0aGlzW29mZnNldCArIDFdIDw8IDgpXG4gIHJldHVybiAodmFsICYgMHg4MDAwKSA/IHZhbCB8IDB4RkZGRjAwMDAgOiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MTZCRSA9IGZ1bmN0aW9uIHJlYWRJbnQxNkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAxXSB8ICh0aGlzW29mZnNldF0gPDwgOClcbiAgcmV0dXJuICh2YWwgJiAweDgwMDApID8gdmFsIHwgMHhGRkZGMDAwMCA6IHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQzMkxFID0gZnVuY3Rpb24gcmVhZEludDMyTEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0pIHxcbiAgICAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAzXSA8PCAyNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MzJCRSA9IGZ1bmN0aW9uIHJlYWRJbnQzMkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdIDw8IDI0KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCA4KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgM10pXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEZsb2F0TEUgPSBmdW5jdGlvbiByZWFkRmxvYXRMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIHRydWUsIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRGbG9hdEJFID0gZnVuY3Rpb24gcmVhZEZsb2F0QkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCBmYWxzZSwgMjMsIDQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUxFID0gZnVuY3Rpb24gcmVhZERvdWJsZUxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDgsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgdHJ1ZSwgNTIsIDgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUJFID0gZnVuY3Rpb24gcmVhZERvdWJsZUJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDgsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgZmFsc2UsIDUyLCA4KVxufVxuXG5mdW5jdGlvbiBjaGVja0ludCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBleHQsIG1heCwgbWluKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGJ1ZikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wiYnVmZmVyXCIgYXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlciBpbnN0YW5jZScpXG4gIGlmICh2YWx1ZSA+IG1heCB8fCB2YWx1ZSA8IG1pbikgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1widmFsdWVcIiBhcmd1bWVudCBpcyBvdXQgb2YgYm91bmRzJylcbiAgaWYgKG9mZnNldCArIGV4dCA+IGJ1Zi5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbmRleCBvdXQgb2YgcmFuZ2UnKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludExFID0gZnVuY3Rpb24gd3JpdGVVSW50TEUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgdmFyIG1heEJ5dGVzID0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpIC0gMVxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG1heEJ5dGVzLCAwKVxuICB9XG5cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAodmFsdWUgLyBtdWwpICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnRCRSA9IGZ1bmN0aW9uIHdyaXRlVUludEJFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBtYXhCeXRlcyA9IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKSAtIDFcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBtYXhCeXRlcywgMClcbiAgfVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aCAtIDFcbiAgdmFyIG11bCA9IDFcbiAgdGhpc1tvZmZzZXQgKyBpXSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoLS1pID49IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB0aGlzW29mZnNldCArIGldID0gKHZhbHVlIC8gbXVsKSAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50OCA9IGZ1bmN0aW9uIHdyaXRlVUludDggKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAxLCAweGZmLCAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgMVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDE2TEUgPSBmdW5jdGlvbiB3cml0ZVVJbnQxNkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHhmZmZmLCAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDE2QkUgPSBmdW5jdGlvbiB3cml0ZVVJbnQxNkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHhmZmZmLCAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDgpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyTEUgPSBmdW5jdGlvbiB3cml0ZVVJbnQzMkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHhmZmZmZmZmZiwgMClcbiAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDE2KVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyQkUgPSBmdW5jdGlvbiB3cml0ZVVJbnQzMkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHhmZmZmZmZmZiwgMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiAyNClcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDgpXG4gIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50TEUgPSBmdW5jdGlvbiB3cml0ZUludExFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBsaW1pdCA9IE1hdGgucG93KDIsICg4ICogYnl0ZUxlbmd0aCkgLSAxKVxuXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbGltaXQgLSAxLCAtbGltaXQpXG4gIH1cblxuICB2YXIgaSA9IDBcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHN1YiA9IDBcbiAgdGhpc1tvZmZzZXRdID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgaWYgKHZhbHVlIDwgMCAmJiBzdWIgPT09IDAgJiYgdGhpc1tvZmZzZXQgKyBpIC0gMV0gIT09IDApIHtcbiAgICAgIHN1YiA9IDFcbiAgICB9XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICgodmFsdWUgLyBtdWwpID4+IDApIC0gc3ViICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludEJFID0gZnVuY3Rpb24gd3JpdGVJbnRCRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbGltaXQgPSBNYXRoLnBvdygyLCAoOCAqIGJ5dGVMZW5ndGgpIC0gMSlcblxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIGxpbWl0IC0gMSwgLWxpbWl0KVxuICB9XG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoIC0gMVxuICB2YXIgbXVsID0gMVxuICB2YXIgc3ViID0gMFxuICB0aGlzW29mZnNldCArIGldID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgtLWkgPj0gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIGlmICh2YWx1ZSA8IDAgJiYgc3ViID09PSAwICYmIHRoaXNbb2Zmc2V0ICsgaSArIDFdICE9PSAwKSB7XG4gICAgICBzdWIgPSAxXG4gICAgfVxuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAoKHZhbHVlIC8gbXVsKSA+PiAwKSAtIHN1YiAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQ4ID0gZnVuY3Rpb24gd3JpdGVJbnQ4ICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMSwgMHg3ZiwgLTB4ODApXG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZiArIHZhbHVlICsgMVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgMVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MTZMRSA9IGZ1bmN0aW9uIHdyaXRlSW50MTZMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4N2ZmZiwgLTB4ODAwMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDE2QkUgPSBmdW5jdGlvbiB3cml0ZUludDE2QkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweDdmZmYsIC0weDgwMDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gOClcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQzMkxFID0gZnVuY3Rpb24gd3JpdGVJbnQzMkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHg3ZmZmZmZmZiwgLTB4ODAwMDAwMDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDE2KVxuICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlID4+PiAyNClcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDMyQkUgPSBmdW5jdGlvbiB3cml0ZUludDMyQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweDdmZmZmZmZmLCAtMHg4MDAwMDAwMClcbiAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgPSAweGZmZmZmZmZmICsgdmFsdWUgKyAxXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDE2KVxuICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuZnVuY3Rpb24gY2hlY2tJRUVFNzU0IChidWYsIHZhbHVlLCBvZmZzZXQsIGV4dCwgbWF4LCBtaW4pIHtcbiAgaWYgKG9mZnNldCArIGV4dCA+IGJ1Zi5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbmRleCBvdXQgb2YgcmFuZ2UnKVxuICBpZiAob2Zmc2V0IDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0luZGV4IG91dCBvZiByYW5nZScpXG59XG5cbmZ1bmN0aW9uIHdyaXRlRmxvYXQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGNoZWNrSUVFRTc1NChidWYsIHZhbHVlLCBvZmZzZXQsIDQsIDMuNDAyODIzNDY2Mzg1Mjg4NmUrMzgsIC0zLjQwMjgyMzQ2NjM4NTI4ODZlKzM4KVxuICB9XG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDIzLCA0KVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRmxvYXRMRSA9IGZ1bmN0aW9uIHdyaXRlRmxvYXRMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVGbG9hdEJFID0gZnVuY3Rpb24gd3JpdGVGbG9hdEJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVGbG9hdCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIHdyaXRlRG91YmxlIChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja0lFRUU3NTQoYnVmLCB2YWx1ZSwgb2Zmc2V0LCA4LCAxLjc5NzY5MzEzNDg2MjMxNTdFKzMwOCwgLTEuNzk3NjkzMTM0ODYyMzE1N0UrMzA4KVxuICB9XG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDUyLCA4KVxuICByZXR1cm4gb2Zmc2V0ICsgOFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlTEUgPSBmdW5jdGlvbiB3cml0ZURvdWJsZUxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVEb3VibGUodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVEb3VibGVCRSA9IGZ1bmN0aW9uIHdyaXRlRG91YmxlQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZURvdWJsZSh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbi8vIGNvcHkodGFyZ2V0QnVmZmVyLCB0YXJnZXRTdGFydD0wLCBzb3VyY2VTdGFydD0wLCBzb3VyY2VFbmQ9YnVmZmVyLmxlbmd0aClcbkJ1ZmZlci5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uIGNvcHkgKHRhcmdldCwgdGFyZ2V0U3RhcnQsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIodGFyZ2V0KSkgdGhyb3cgbmV3IFR5cGVFcnJvcignYXJndW1lbnQgc2hvdWxkIGJlIGEgQnVmZmVyJylcbiAgaWYgKCFzdGFydCkgc3RhcnQgPSAwXG4gIGlmICghZW5kICYmIGVuZCAhPT0gMCkgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKHRhcmdldFN0YXJ0ID49IHRhcmdldC5sZW5ndGgpIHRhcmdldFN0YXJ0ID0gdGFyZ2V0Lmxlbmd0aFxuICBpZiAoIXRhcmdldFN0YXJ0KSB0YXJnZXRTdGFydCA9IDBcbiAgaWYgKGVuZCA+IDAgJiYgZW5kIDwgc3RhcnQpIGVuZCA9IHN0YXJ0XG5cbiAgLy8gQ29weSAwIGJ5dGVzOyB3ZSdyZSBkb25lXG4gIGlmIChlbmQgPT09IHN0YXJ0KSByZXR1cm4gMFxuICBpZiAodGFyZ2V0Lmxlbmd0aCA9PT0gMCB8fCB0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDBcblxuICAvLyBGYXRhbCBlcnJvciBjb25kaXRpb25zXG4gIGlmICh0YXJnZXRTdGFydCA8IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcigndGFyZ2V0U3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIH1cbiAgaWYgKHN0YXJ0IDwgMCB8fCBzdGFydCA+PSB0aGlzLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0luZGV4IG91dCBvZiByYW5nZScpXG4gIGlmIChlbmQgPCAwKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignc291cmNlRW5kIG91dCBvZiBib3VuZHMnKVxuXG4gIC8vIEFyZSB3ZSBvb2I/XG4gIGlmIChlbmQgPiB0aGlzLmxlbmd0aCkgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKHRhcmdldC5sZW5ndGggLSB0YXJnZXRTdGFydCA8IGVuZCAtIHN0YXJ0KSB7XG4gICAgZW5kID0gdGFyZ2V0Lmxlbmd0aCAtIHRhcmdldFN0YXJ0ICsgc3RhcnRcbiAgfVxuXG4gIHZhciBsZW4gPSBlbmQgLSBzdGFydFxuXG4gIGlmICh0aGlzID09PSB0YXJnZXQgJiYgdHlwZW9mIFVpbnQ4QXJyYXkucHJvdG90eXBlLmNvcHlXaXRoaW4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAvLyBVc2UgYnVpbHQtaW4gd2hlbiBhdmFpbGFibGUsIG1pc3NpbmcgZnJvbSBJRTExXG4gICAgdGhpcy5jb3B5V2l0aGluKHRhcmdldFN0YXJ0LCBzdGFydCwgZW5kKVxuICB9IGVsc2UgaWYgKHRoaXMgPT09IHRhcmdldCAmJiBzdGFydCA8IHRhcmdldFN0YXJ0ICYmIHRhcmdldFN0YXJ0IDwgZW5kKSB7XG4gICAgLy8gZGVzY2VuZGluZyBjb3B5IGZyb20gZW5kXG4gICAgZm9yICh2YXIgaSA9IGxlbiAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgICB0YXJnZXRbaSArIHRhcmdldFN0YXJ0XSA9IHRoaXNbaSArIHN0YXJ0XVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBVaW50OEFycmF5LnByb3RvdHlwZS5zZXQuY2FsbChcbiAgICAgIHRhcmdldCxcbiAgICAgIHRoaXMuc3ViYXJyYXkoc3RhcnQsIGVuZCksXG4gICAgICB0YXJnZXRTdGFydFxuICAgIClcbiAgfVxuXG4gIHJldHVybiBsZW5cbn1cblxuLy8gVXNhZ2U6XG4vLyAgICBidWZmZXIuZmlsbChudW1iZXJbLCBvZmZzZXRbLCBlbmRdXSlcbi8vICAgIGJ1ZmZlci5maWxsKGJ1ZmZlclssIG9mZnNldFssIGVuZF1dKVxuLy8gICAgYnVmZmVyLmZpbGwoc3RyaW5nWywgb2Zmc2V0WywgZW5kXV1bLCBlbmNvZGluZ10pXG5CdWZmZXIucHJvdG90eXBlLmZpbGwgPSBmdW5jdGlvbiBmaWxsICh2YWwsIHN0YXJ0LCBlbmQsIGVuY29kaW5nKSB7XG4gIC8vIEhhbmRsZSBzdHJpbmcgY2FzZXM6XG4gIGlmICh0eXBlb2YgdmFsID09PSAnc3RyaW5nJykge1xuICAgIGlmICh0eXBlb2Ygc3RhcnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBlbmNvZGluZyA9IHN0YXJ0XG4gICAgICBzdGFydCA9IDBcbiAgICAgIGVuZCA9IHRoaXMubGVuZ3RoXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZW5kID09PSAnc3RyaW5nJykge1xuICAgICAgZW5jb2RpbmcgPSBlbmRcbiAgICAgIGVuZCA9IHRoaXMubGVuZ3RoXG4gICAgfVxuICAgIGlmIChlbmNvZGluZyAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiBlbmNvZGluZyAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2VuY29kaW5nIG11c3QgYmUgYSBzdHJpbmcnKVxuICAgIH1cbiAgICBpZiAodHlwZW9mIGVuY29kaW5nID09PSAnc3RyaW5nJyAmJiAhQnVmZmVyLmlzRW5jb2RpbmcoZW5jb2RpbmcpKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gICAgfVxuICAgIGlmICh2YWwubGVuZ3RoID09PSAxKSB7XG4gICAgICB2YXIgY29kZSA9IHZhbC5jaGFyQ29kZUF0KDApXG4gICAgICBpZiAoKGVuY29kaW5nID09PSAndXRmOCcgJiYgY29kZSA8IDEyOCkgfHxcbiAgICAgICAgICBlbmNvZGluZyA9PT0gJ2xhdGluMScpIHtcbiAgICAgICAgLy8gRmFzdCBwYXRoOiBJZiBgdmFsYCBmaXRzIGludG8gYSBzaW5nbGUgYnl0ZSwgdXNlIHRoYXQgbnVtZXJpYyB2YWx1ZS5cbiAgICAgICAgdmFsID0gY29kZVxuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIGlmICh0eXBlb2YgdmFsID09PSAnbnVtYmVyJykge1xuICAgIHZhbCA9IHZhbCAmIDI1NVxuICB9XG5cbiAgLy8gSW52YWxpZCByYW5nZXMgYXJlIG5vdCBzZXQgdG8gYSBkZWZhdWx0LCBzbyBjYW4gcmFuZ2UgY2hlY2sgZWFybHkuXG4gIGlmIChzdGFydCA8IDAgfHwgdGhpcy5sZW5ndGggPCBzdGFydCB8fCB0aGlzLmxlbmd0aCA8IGVuZCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdPdXQgb2YgcmFuZ2UgaW5kZXgnKVxuICB9XG5cbiAgaWYgKGVuZCA8PSBzdGFydCkge1xuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBzdGFydCA9IHN0YXJ0ID4+PiAwXG4gIGVuZCA9IGVuZCA9PT0gdW5kZWZpbmVkID8gdGhpcy5sZW5ndGggOiBlbmQgPj4+IDBcblxuICBpZiAoIXZhbCkgdmFsID0gMFxuXG4gIHZhciBpXG4gIGlmICh0eXBlb2YgdmFsID09PSAnbnVtYmVyJykge1xuICAgIGZvciAoaSA9IHN0YXJ0OyBpIDwgZW5kOyArK2kpIHtcbiAgICAgIHRoaXNbaV0gPSB2YWxcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdmFyIGJ5dGVzID0gQnVmZmVyLmlzQnVmZmVyKHZhbClcbiAgICAgID8gdmFsXG4gICAgICA6IEJ1ZmZlci5mcm9tKHZhbCwgZW5jb2RpbmcpXG4gICAgdmFyIGxlbiA9IGJ5dGVzLmxlbmd0aFxuICAgIGlmIChsZW4gPT09IDApIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1RoZSB2YWx1ZSBcIicgKyB2YWwgK1xuICAgICAgICAnXCIgaXMgaW52YWxpZCBmb3IgYXJndW1lbnQgXCJ2YWx1ZVwiJylcbiAgICB9XG4gICAgZm9yIChpID0gMDsgaSA8IGVuZCAtIHN0YXJ0OyArK2kpIHtcbiAgICAgIHRoaXNbaSArIHN0YXJ0XSA9IGJ5dGVzW2kgJSBsZW5dXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXNcbn1cblxuLy8gSEVMUEVSIEZVTkNUSU9OU1xuLy8gPT09PT09PT09PT09PT09PVxuXG52YXIgSU5WQUxJRF9CQVNFNjRfUkUgPSAvW14rLzAtOUEtWmEtei1fXS9nXG5cbmZ1bmN0aW9uIGJhc2U2NGNsZWFuIChzdHIpIHtcbiAgLy8gTm9kZSB0YWtlcyBlcXVhbCBzaWducyBhcyBlbmQgb2YgdGhlIEJhc2U2NCBlbmNvZGluZ1xuICBzdHIgPSBzdHIuc3BsaXQoJz0nKVswXVxuICAvLyBOb2RlIHN0cmlwcyBvdXQgaW52YWxpZCBjaGFyYWN0ZXJzIGxpa2UgXFxuIGFuZCBcXHQgZnJvbSB0aGUgc3RyaW5nLCBiYXNlNjQtanMgZG9lcyBub3RcbiAgc3RyID0gc3RyLnRyaW0oKS5yZXBsYWNlKElOVkFMSURfQkFTRTY0X1JFLCAnJylcbiAgLy8gTm9kZSBjb252ZXJ0cyBzdHJpbmdzIHdpdGggbGVuZ3RoIDwgMiB0byAnJ1xuICBpZiAoc3RyLmxlbmd0aCA8IDIpIHJldHVybiAnJ1xuICAvLyBOb2RlIGFsbG93cyBmb3Igbm9uLXBhZGRlZCBiYXNlNjQgc3RyaW5ncyAobWlzc2luZyB0cmFpbGluZyA9PT0pLCBiYXNlNjQtanMgZG9lcyBub3RcbiAgd2hpbGUgKHN0ci5sZW5ndGggJSA0ICE9PSAwKSB7XG4gICAgc3RyID0gc3RyICsgJz0nXG4gIH1cbiAgcmV0dXJuIHN0clxufVxuXG5mdW5jdGlvbiB0b0hleCAobikge1xuICBpZiAobiA8IDE2KSByZXR1cm4gJzAnICsgbi50b1N0cmluZygxNilcbiAgcmV0dXJuIG4udG9TdHJpbmcoMTYpXG59XG5cbmZ1bmN0aW9uIHV0ZjhUb0J5dGVzIChzdHJpbmcsIHVuaXRzKSB7XG4gIHVuaXRzID0gdW5pdHMgfHwgSW5maW5pdHlcbiAgdmFyIGNvZGVQb2ludFxuICB2YXIgbGVuZ3RoID0gc3RyaW5nLmxlbmd0aFxuICB2YXIgbGVhZFN1cnJvZ2F0ZSA9IG51bGxcbiAgdmFyIGJ5dGVzID0gW11cblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgKytpKSB7XG4gICAgY29kZVBvaW50ID0gc3RyaW5nLmNoYXJDb2RlQXQoaSlcblxuICAgIC8vIGlzIHN1cnJvZ2F0ZSBjb21wb25lbnRcbiAgICBpZiAoY29kZVBvaW50ID4gMHhEN0ZGICYmIGNvZGVQb2ludCA8IDB4RTAwMCkge1xuICAgICAgLy8gbGFzdCBjaGFyIHdhcyBhIGxlYWRcbiAgICAgIGlmICghbGVhZFN1cnJvZ2F0ZSkge1xuICAgICAgICAvLyBubyBsZWFkIHlldFxuICAgICAgICBpZiAoY29kZVBvaW50ID4gMHhEQkZGKSB7XG4gICAgICAgICAgLy8gdW5leHBlY3RlZCB0cmFpbFxuICAgICAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH0gZWxzZSBpZiAoaSArIDEgPT09IGxlbmd0aCkge1xuICAgICAgICAgIC8vIHVucGFpcmVkIGxlYWRcbiAgICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gdmFsaWQgbGVhZFxuICAgICAgICBsZWFkU3Vycm9nYXRlID0gY29kZVBvaW50XG5cbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgLy8gMiBsZWFkcyBpbiBhIHJvd1xuICAgICAgaWYgKGNvZGVQb2ludCA8IDB4REMwMCkge1xuICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgbGVhZFN1cnJvZ2F0ZSA9IGNvZGVQb2ludFxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICAvLyB2YWxpZCBzdXJyb2dhdGUgcGFpclxuICAgICAgY29kZVBvaW50ID0gKGxlYWRTdXJyb2dhdGUgLSAweEQ4MDAgPDwgMTAgfCBjb2RlUG9pbnQgLSAweERDMDApICsgMHgxMDAwMFxuICAgIH0gZWxzZSBpZiAobGVhZFN1cnJvZ2F0ZSkge1xuICAgICAgLy8gdmFsaWQgYm1wIGNoYXIsIGJ1dCBsYXN0IGNoYXIgd2FzIGEgbGVhZFxuICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgfVxuXG4gICAgbGVhZFN1cnJvZ2F0ZSA9IG51bGxcblxuICAgIC8vIGVuY29kZSB1dGY4XG4gICAgaWYgKGNvZGVQb2ludCA8IDB4ODApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMSkgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChjb2RlUG9pbnQpXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDgwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSAyKSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2IHwgMHhDMCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4MTAwMDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMykgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4QyB8IDB4RTAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDYgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4MTEwMDAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDQpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDEyIHwgMHhGMCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4QyAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2ICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjb2RlIHBvaW50JylcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYnl0ZXNcbn1cblxuZnVuY3Rpb24gYXNjaWlUb0J5dGVzIChzdHIpIHtcbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgKytpKSB7XG4gICAgLy8gTm9kZSdzIGNvZGUgc2VlbXMgdG8gYmUgZG9pbmcgdGhpcyBhbmQgbm90ICYgMHg3Ri4uXG4gICAgYnl0ZUFycmF5LnB1c2goc3RyLmNoYXJDb2RlQXQoaSkgJiAweEZGKVxuICB9XG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gdXRmMTZsZVRvQnl0ZXMgKHN0ciwgdW5pdHMpIHtcbiAgdmFyIGMsIGhpLCBsb1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyArK2kpIHtcbiAgICBpZiAoKHVuaXRzIC09IDIpIDwgMCkgYnJlYWtcblxuICAgIGMgPSBzdHIuY2hhckNvZGVBdChpKVxuICAgIGhpID0gYyA+PiA4XG4gICAgbG8gPSBjICUgMjU2XG4gICAgYnl0ZUFycmF5LnB1c2gobG8pXG4gICAgYnl0ZUFycmF5LnB1c2goaGkpXG4gIH1cblxuICByZXR1cm4gYnl0ZUFycmF5XG59XG5cbmZ1bmN0aW9uIGJhc2U2NFRvQnl0ZXMgKHN0cikge1xuICByZXR1cm4gYmFzZTY0LnRvQnl0ZUFycmF5KGJhc2U2NGNsZWFuKHN0cikpXG59XG5cbmZ1bmN0aW9uIGJsaXRCdWZmZXIgKHNyYywgZHN0LCBvZmZzZXQsIGxlbmd0aCkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgKytpKSB7XG4gICAgaWYgKChpICsgb2Zmc2V0ID49IGRzdC5sZW5ndGgpIHx8IChpID49IHNyYy5sZW5ndGgpKSBicmVha1xuICAgIGRzdFtpICsgb2Zmc2V0XSA9IHNyY1tpXVxuICB9XG4gIHJldHVybiBpXG59XG5cbi8vIEFycmF5QnVmZmVyIG9yIFVpbnQ4QXJyYXkgb2JqZWN0cyBmcm9tIG90aGVyIGNvbnRleHRzIChpLmUuIGlmcmFtZXMpIGRvIG5vdCBwYXNzXG4vLyB0aGUgYGluc3RhbmNlb2ZgIGNoZWNrIGJ1dCB0aGV5IHNob3VsZCBiZSB0cmVhdGVkIGFzIG9mIHRoYXQgdHlwZS5cbi8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXIvaXNzdWVzLzE2NlxuZnVuY3Rpb24gaXNJbnN0YW5jZSAob2JqLCB0eXBlKSB7XG4gIHJldHVybiBvYmogaW5zdGFuY2VvZiB0eXBlIHx8XG4gICAgKG9iaiAhPSBudWxsICYmIG9iai5jb25zdHJ1Y3RvciAhPSBudWxsICYmIG9iai5jb25zdHJ1Y3Rvci5uYW1lICE9IG51bGwgJiZcbiAgICAgIG9iai5jb25zdHJ1Y3Rvci5uYW1lID09PSB0eXBlLm5hbWUpXG59XG5mdW5jdGlvbiBudW1iZXJJc05hTiAob2JqKSB7XG4gIC8vIEZvciBJRTExIHN1cHBvcnRcbiAgcmV0dXJuIG9iaiAhPT0gb2JqIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tc2VsZi1jb21wYXJlXG59XG4iLCIvKiEgaWVlZTc1NC4gQlNELTMtQ2xhdXNlIExpY2Vuc2UuIEZlcm9zcyBBYm91a2hhZGlqZWggPGh0dHBzOi8vZmVyb3NzLm9yZy9vcGVuc291cmNlPiAqL1xuZXhwb3J0cy5yZWFkID0gZnVuY3Rpb24gKGJ1ZmZlciwgb2Zmc2V0LCBpc0xFLCBtTGVuLCBuQnl0ZXMpIHtcbiAgdmFyIGUsIG1cbiAgdmFyIGVMZW4gPSAobkJ5dGVzICogOCkgLSBtTGVuIC0gMVxuICB2YXIgZU1heCA9ICgxIDw8IGVMZW4pIC0gMVxuICB2YXIgZUJpYXMgPSBlTWF4ID4+IDFcbiAgdmFyIG5CaXRzID0gLTdcbiAgdmFyIGkgPSBpc0xFID8gKG5CeXRlcyAtIDEpIDogMFxuICB2YXIgZCA9IGlzTEUgPyAtMSA6IDFcbiAgdmFyIHMgPSBidWZmZXJbb2Zmc2V0ICsgaV1cblxuICBpICs9IGRcblxuICBlID0gcyAmICgoMSA8PCAoLW5CaXRzKSkgLSAxKVxuICBzID4+PSAoLW5CaXRzKVxuICBuQml0cyArPSBlTGVuXG4gIGZvciAoOyBuQml0cyA+IDA7IGUgPSAoZSAqIDI1NikgKyBidWZmZXJbb2Zmc2V0ICsgaV0sIGkgKz0gZCwgbkJpdHMgLT0gOCkge31cblxuICBtID0gZSAmICgoMSA8PCAoLW5CaXRzKSkgLSAxKVxuICBlID4+PSAoLW5CaXRzKVxuICBuQml0cyArPSBtTGVuXG4gIGZvciAoOyBuQml0cyA+IDA7IG0gPSAobSAqIDI1NikgKyBidWZmZXJbb2Zmc2V0ICsgaV0sIGkgKz0gZCwgbkJpdHMgLT0gOCkge31cblxuICBpZiAoZSA9PT0gMCkge1xuICAgIGUgPSAxIC0gZUJpYXNcbiAgfSBlbHNlIGlmIChlID09PSBlTWF4KSB7XG4gICAgcmV0dXJuIG0gPyBOYU4gOiAoKHMgPyAtMSA6IDEpICogSW5maW5pdHkpXG4gIH0gZWxzZSB7XG4gICAgbSA9IG0gKyBNYXRoLnBvdygyLCBtTGVuKVxuICAgIGUgPSBlIC0gZUJpYXNcbiAgfVxuICByZXR1cm4gKHMgPyAtMSA6IDEpICogbSAqIE1hdGgucG93KDIsIGUgLSBtTGVuKVxufVxuXG5leHBvcnRzLndyaXRlID0gZnVuY3Rpb24gKGJ1ZmZlciwgdmFsdWUsIG9mZnNldCwgaXNMRSwgbUxlbiwgbkJ5dGVzKSB7XG4gIHZhciBlLCBtLCBjXG4gIHZhciBlTGVuID0gKG5CeXRlcyAqIDgpIC0gbUxlbiAtIDFcbiAgdmFyIGVNYXggPSAoMSA8PCBlTGVuKSAtIDFcbiAgdmFyIGVCaWFzID0gZU1heCA+PiAxXG4gIHZhciBydCA9IChtTGVuID09PSAyMyA/IE1hdGgucG93KDIsIC0yNCkgLSBNYXRoLnBvdygyLCAtNzcpIDogMClcbiAgdmFyIGkgPSBpc0xFID8gMCA6IChuQnl0ZXMgLSAxKVxuICB2YXIgZCA9IGlzTEUgPyAxIDogLTFcbiAgdmFyIHMgPSB2YWx1ZSA8IDAgfHwgKHZhbHVlID09PSAwICYmIDEgLyB2YWx1ZSA8IDApID8gMSA6IDBcblxuICB2YWx1ZSA9IE1hdGguYWJzKHZhbHVlKVxuXG4gIGlmIChpc05hTih2YWx1ZSkgfHwgdmFsdWUgPT09IEluZmluaXR5KSB7XG4gICAgbSA9IGlzTmFOKHZhbHVlKSA/IDEgOiAwXG4gICAgZSA9IGVNYXhcbiAgfSBlbHNlIHtcbiAgICBlID0gTWF0aC5mbG9vcihNYXRoLmxvZyh2YWx1ZSkgLyBNYXRoLkxOMilcbiAgICBpZiAodmFsdWUgKiAoYyA9IE1hdGgucG93KDIsIC1lKSkgPCAxKSB7XG4gICAgICBlLS1cbiAgICAgIGMgKj0gMlxuICAgIH1cbiAgICBpZiAoZSArIGVCaWFzID49IDEpIHtcbiAgICAgIHZhbHVlICs9IHJ0IC8gY1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSArPSBydCAqIE1hdGgucG93KDIsIDEgLSBlQmlhcylcbiAgICB9XG4gICAgaWYgKHZhbHVlICogYyA+PSAyKSB7XG4gICAgICBlKytcbiAgICAgIGMgLz0gMlxuICAgIH1cblxuICAgIGlmIChlICsgZUJpYXMgPj0gZU1heCkge1xuICAgICAgbSA9IDBcbiAgICAgIGUgPSBlTWF4XG4gICAgfSBlbHNlIGlmIChlICsgZUJpYXMgPj0gMSkge1xuICAgICAgbSA9ICgodmFsdWUgKiBjKSAtIDEpICogTWF0aC5wb3coMiwgbUxlbilcbiAgICAgIGUgPSBlICsgZUJpYXNcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IHZhbHVlICogTWF0aC5wb3coMiwgZUJpYXMgLSAxKSAqIE1hdGgucG93KDIsIG1MZW4pXG4gICAgICBlID0gMFxuICAgIH1cbiAgfVxuXG4gIGZvciAoOyBtTGVuID49IDg7IGJ1ZmZlcltvZmZzZXQgKyBpXSA9IG0gJiAweGZmLCBpICs9IGQsIG0gLz0gMjU2LCBtTGVuIC09IDgpIHt9XG5cbiAgZSA9IChlIDw8IG1MZW4pIHwgbVxuICBlTGVuICs9IG1MZW5cbiAgZm9yICg7IGVMZW4gPiAwOyBidWZmZXJbb2Zmc2V0ICsgaV0gPSBlICYgMHhmZiwgaSArPSBkLCBlIC89IDI1NiwgZUxlbiAtPSA4KSB7fVxuXG4gIGJ1ZmZlcltvZmZzZXQgKyBpIC0gZF0gfD0gcyAqIDEyOFxufVxuIiwiLy8gSW1wb3J0IEJpZy5qc1xyXG5pbXBvcnQgQmlnIGZyb20gJ2JpZy5qcyc7XHJcblxyXG4vLyBDb25maWd1cmUgQmlnLmpzIGZvciBoaWdoIHByZWNpc2lvblxyXG5CaWcuRFAgPSA1MDsgLy8gU2V0IGRlY2ltYWwgcGxhY2VzXHJcbkJpZy5STSA9IEJpZy5yb3VuZEhhbGZVcDsgLy8gUm91bmRpbmcgbW9kZVxyXG5cclxuXHJcbndpbmRvdy5saXN0RGVwb3NpdHMgPSBsaXN0RGVwb3NpdHM7XHJcbndpbmRvdy51c2VDb25uZWN0ZWRXYWxsZXRBZGRyZXNzID0gdXNlQ29ubmVjdGVkV2FsbGV0QWRkcmVzcztcclxud2luZG93LmJ0bkRpc2Nvbm5lY3RXYWxsZXQgPSBidG5EaXNjb25uZWN0V2FsbGV0O1xyXG53aW5kb3cuYnRuQ29ubmVjdFdhbGxldCA9IGJ0bkNvbm5lY3RXYWxsZXQ7XHJcblxyXG5cclxuLy8gQ29uZmlndXJhdGlvblxyXG5jb25zdCBMQ0RfVVJMID0gXCJodHRwczovL3Jlc3QuY29zbW9zLmRpcmVjdG9yeS9sdW1uZXR3b3JrXCI7XHJcbmNvbnN0IFJQQ19VUkwgPSBcImh0dHBzOi8vcnBjLmNvc21vcy5kaXJlY3RvcnkvbHVtbmV0d29ya1wiO1xyXG5jb25zdCBDSEFJTl9JRCA9IFwibHVtLW5ldHdvcmstMVwiO1xyXG5jb25zdCBERU5PTSA9IFwidWx1bVwiO1xyXG5jb25zdCBHQVNfTElNSVQgPSAyMDAwMDA7XHJcbmNvbnN0IEdBU19QUklDRSA9IFwiMC4wMDI1XCI7IC8vIGluIHVsdW1cclxuXHJcbi8vIEhhcmRjb2RlZCBkZW5vbWluYXRpb24gbWFwcGluZ1xyXG5jb25zdCBERU5PTUlOQVRJT05TID0ge1xyXG4gICAgJ2liYy9BOEMyRDIzQTFFNkY5NURBNEU0OEJBMzQ5NjY3RTMyMkJEN0E2Qzk5NkQ4QTRBQUU4QkE3MkUxOTBGM0QxNDc3Jzoge1xyXG4gICAgICAgIG5hbWU6ICdBVE9NJyxcclxuICAgICAgICBkZWNpbWFsczogNlxyXG4gICAgfSxcclxuICAgICdpYmMvMjczOTRGQjA5MkQyRUNDRDU2MTIzQzc0RjM2RTRDMUY5MjYwMDFDRUFEQTlDQTk3RUE2MjJCMjVGNDFFNUVCMic6IHtcclxuICAgICAgICBuYW1lOiAnQVRPTScsXHJcbiAgICAgICAgZGVjaW1hbHM6IDZcclxuICAgIH0sXHJcbiAgICAnaWJjLzUxQTgxOEQ4QkJDMzg1QzE1MjQxNTg4MjI4NkM2MjE2OUMwNTQ5OEI4RUJDRkIzODMxMEIxMzY3NTgzODYwRkYnOiB7XHJcbiAgICAgICAgbmFtZTogJ0hVQUhVQScsXHJcbiAgICAgICAgZGVjaW1hbHM6IDZcclxuICAgIH0sXHJcbiAgICAnaWJjLzQ3QkQyMDkxNzk4NTlDREU0QTI4MDY3NjNENzE4OUI2RTZGRTEzQTE3ODgwRkUyQjQyREUxRTZDMUUzMjlFMjMnOiB7XHJcbiAgICAgICAgbmFtZTogJ09TTU8nLFxyXG4gICAgICAgIGRlY2ltYWxzOiA2XHJcbiAgICB9LFxyXG4gICAgJ2liYy8xMTBBMjY1NDhDNTE0MDQyQUZEREVCMUQ0QjQ2RTcxQzFENDNEOTY3MjY1OUEzQzk1OEQ3MzY1RkVFQ0Q5Mzg4Jzoge1xyXG4gICAgICAgIG5hbWU6ICdJTkonLFxyXG4gICAgICAgIGRlY2ltYWxzOiAxOFxyXG4gICAgfVxyXG59O1xyXG5cclxuLy8gTG9hZGluZyBzdGF0ZSBtYW5hZ2VtZW50XHJcbmxldCBpc0xvYWRpbmcgPSBmYWxzZTtcclxubGV0IHRvdGFsRGVwb3NpdHMgPSAwO1xyXG5sZXQgY3VycmVudFBhZ2UgPSAxO1xyXG4oYXN5bmMgKCkgPT4ge1xyXG5cclxuICAgIC8vIHdhaXRzIGZvciB3aW5kb3cua2VwbHIgdG8gZXhpc3QgKGlmIGV4dGVuc2lvbiBpcyBpbnN0YWxsZWQsIGVuYWJsZWQgYW5kIGluamVjdGluZyBpdHMgY29udGVudCBzY3JpcHQpXHJcbiAgICBhd2FpdCBnZXRLZXBscigpO1xyXG4gICAgLy8gb2sga2VwbHIgaXMgcHJlc2VudC4uLiBlbmFibGUgY2hhaW5cclxuICAgIGF3YWl0IGtlcGxyX2Nvbm5lY3RMdW0oKTtcclxuXHJcbiAgICAvLyBjaGVjayBVUkwgZm9yIGlkIGZpZWxkLCBhbmQgc2V0IHZhbHVlIG9mIG9yZGVySWQgaW5wdXRcclxuICAgIGNvbnN0IHVybFBhcmFtcyA9IG5ldyBVUkxTZWFyY2hQYXJhbXMod2luZG93LmxvY2F0aW9uLnNlYXJjaCk7XHJcbiAgICBjb25zdCB3YWxsZXRBZGRyZXNzID0gdXJsUGFyYW1zLmdldCgnd2FsbGV0QWRkcmVzcycpO1xyXG4gICAgaWYgKHdhbGxldEFkZHJlc3MpIHtcclxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNlYXJjaFdhbGxldEFkZHJlc3NcIikudmFsdWUgPSB3YWxsZXRBZGRyZXNzO1xyXG4gICAgfVxyXG59KSgpO1xyXG5cclxuLy8gLy8gSU5JVElBTElaQVRJT046XHJcbmFzeW5jIGZ1bmN0aW9uIGdldEtlcGxyKCkge1xyXG4gICAgaWYgKHdpbmRvdy5rZXBscikge1xyXG4gICAgICAgIHJldHVybiB3aW5kb3cua2VwbHI7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09IFwiY29tcGxldGVcIikge1xyXG4gICAgICAgIHJldHVybiB3aW5kb3cua2VwbHI7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgY29uc3QgZG9jdW1lbnRTdGF0ZUNoYW5nZSA9IChldmVudCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAoZXZlbnQudGFyZ2V0ICYmIGV2ZW50LnRhcmdldC5yZWFkeVN0YXRlID09PSBcImNvbXBsZXRlXCIpIHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUod2luZG93LmtlcGxyKTtcclxuICAgICAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJyZWFkeXN0YXRlY2hhbmdlXCIsIGRvY3VtZW50U3RhdGVDaGFuZ2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInJlYWR5c3RhdGVjaGFuZ2VcIiwgZG9jdW1lbnRTdGF0ZUNoYW5nZSk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24ga2VwbHJfY29ubmVjdEx1bSgpIHtcclxuICAgIGF3YWl0IHN1Z2dlc3RDaGFpbkx1bSgpXHJcbiAgICAgICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAvLyBDaGFpbiBzdWdnZXN0ZWQgc3VjY2Vzc2Z1bGx5XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQ2hhaW4gc3VnZ2VzdGVkIHN1Y2Nlc3NmdWxseVwiKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5jYXRjaCgoZXJyb3IpID0+IHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIHN1Z2dlc3RpbmcgY2hhaW46XCIsIGVycm9yKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICBhd2FpdCB3aW5kb3cua2VwbHJcclxuICAgICAgICA/LmVuYWJsZShcImx1bS1uZXR3b3JrLTFcIilcclxuICAgICAgICAudGhlbihhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgIC8vIENvbm5lY3RlZFxyXG4gICAgICAgICAgICBrZXBscl9jaGFpbnNfb25Db25uZWN0ZWQoKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5jYXRjaCgoKSA9PiB7XHJcbiAgICAgICAgICAgIC8vIFJlamVjdGVkXHJcbiAgICAgICAgICAgIGtlcGxyX2NoYWluc19vblJlamVjdGVkKCk7XHJcbiAgICAgICAgfSk7XHJcbn1cclxuXHJcbi8vIGdldCBsdW0gd2FsbGV0IGZyb20gdXNlcidzIHNlbGVjdGVkIGFjY291bnQgaW4ga2VwbHIgZXh0ZW5zaW9uXHJcbmFzeW5jIGZ1bmN0aW9uIGdldEx1bVdhbGxldCgpIHtcclxuICAgIGNvbnN0IHdhbGxldCA9IGF3YWl0IHdpbmRvdy5rZXBscj8uZ2V0S2V5KFwibHVtLW5ldHdvcmstMVwiKS50aGVuKCh1c2VyX2tleSkgPT4ge1xyXG4gICAgICAgIHJldHVybiB1c2VyX2tleTtcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIHdhbGxldDtcclxufVxyXG53aW5kb3cuZ2V0THVtV2FsbGV0ID0gZ2V0THVtV2FsbGV0O1xyXG5cclxuLy8gRVZFTlQgSEFORExFUlNcclxuYXN5bmMgZnVuY3Rpb24ga2VwbHJfY2hhaW5zX29uQ29ubmVjdGVkKCkge1xyXG5cclxuICAgIGNvbnN0IHdhbGxldCA9IGF3YWl0IGdldEx1bVdhbGxldCgpO1xyXG4gICAgdWlfc2V0V2FsbGV0KHdhbGxldCk7XHJcblxyXG4gICAgLy8gcmVnaXN0ZXIgZXZlbnQgaGFuZGxlcjogaWYgdXNlciBjaGFuZ2VzIGFjY291bnQ6XHJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImtlcGxyX2tleXN0b3JlY2hhbmdlXCIsIGtlcGxyX2tleXN0b3JlX29uQ2hhbmdlKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24ga2VwbHJfY2hhaW5zX29uUmVqZWN0ZWQoKSB7XHJcbiAgICB1aV9zZXRXYWxsZXQodW5kZWZpbmVkKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24ga2VwbHJfa2V5c3RvcmVfb25DaGFuZ2UoZSkge1xyXG4gICAgY29uc3Qgd2FsbGV0ID0gYXdhaXQgZ2V0THVtV2FsbGV0KCk7XHJcbiAgICB1aV9zZXRXYWxsZXQod2FsbGV0KTtcclxufVxyXG5cclxuLy8gRVhQT1JURUQgVE8gQSBHTE9CQUwgXCJtb2R1bGVcIiBPQkpFQ1QgRk9SIElOTElORSBIVE1MIERPTSBFVkVOVCBMSVNURU5FUlNcclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBidG5Db25uZWN0S2VwbHJfb25DbGljaygpIHtcclxuICAgIC8vIGNvbm5lY3QgS2VwbHIgd2FsbGV0IGV4dGVuc2lvblxyXG4gICAgYXdhaXQga2VwbHJfY29ubmVjdEx1bSgpO1xyXG59XHJcblxyXG5cclxuYXN5bmMgZnVuY3Rpb24gdWlfc2V0V2FsbGV0KHdhbGxldCkge1xyXG4gICAgaWYgKHdhbGxldCkge1xyXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY29ubmVjdGVkV2FsbGV0QWRkcmVzc1wiKS5pbm5lckhUTUwgPSB3YWxsZXQuYmVjaDMyQWRkcmVzcztcclxuICAgICAgICB1aV9zaG93RWxlbWVudEJ5SWQoXCJ3YWxsZXRDb250YWluZXJcIik7XHJcbiAgICAgICAgLy8gdWlfc2hvd0VsZW1lbnRCeUlkKFwib3JkZXJzXCIpO1xyXG4gICAgICAgIHVpX2hpZGVFbGVtZW50QnlJZChcImJ0bkNvbm5lY3RcIik7XHJcblxyXG4gICAgICAgIC8vIGF3YWl0IGxpc3REZXBvc2l0cyh3YWxsZXQuYmVjaDMyQWRkcmVzcyk7XHJcbiAgICAgICAgLy8gYXdhaXQgZmV0Y2hBbGxEZXBvc2l0cyh3YWxsZXQuYmVjaDMyQWRkcmVzcyk7XHJcblxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB1aV9oaWRlRWxlbWVudEJ5SWQoXCJ3YWxsZXRDb250YWluZXJcIik7XHJcbiAgICAgICAgLy8gdWlfaGlkZUVsZW1lbnRCeUlkKFwib3JkZXJzXCIpO1xyXG4gICAgICAgIHVpX3Nob3dFbGVtZW50QnlJZChcImJ0bkNvbm5lY3RcIik7XHJcbiAgICB9XHJcbiAgICB1aV9yZWluaXRpYWxpemUoKTtcclxufVxyXG4vLyBmdW5jdGlvbiB0byByZWluaXRpYWxpemUgdWlcclxuZnVuY3Rpb24gdWlfcmVpbml0aWFsaXplKCkge1xyXG4gICAgdWlfaGlkZVJlc3BvbnNlKCk7XHJcbiAgICB1aV9oaWRlRXJyb3IoKTtcclxufVxyXG5cclxuLyogc2hvdyBhbmQgaGlkZSByZXNwb25zZSAqL1xyXG4vLyBmdW5jdGlvbiB0byB1cGRhdGUgdGhlIGxhc3QgdHJhbnNhY3Rpb24gaGFzaFxyXG5mdW5jdGlvbiB1aV9zaG93UmVzcG9uc2UocmVzdWx0KSB7XHJcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImRpdlJlc3BvbnNlXCIpLmlubmVySFRNTCA9IEpTT04uc3RyaW5naWZ5KHJlc3VsdCwgbnVsbCwgMik7XHJcbiAgICB1aV9zaG93RWxlbWVudEJ5SWQoXCJyZXNwb25zZUNvbnRhaW5lclwiKTtcclxufVxyXG5mdW5jdGlvbiB1aV9oaWRlUmVzcG9uc2UoKSB7XHJcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImRpdlJlc3BvbnNlXCIpLmlubmVySFRNTCA9IFwiXCI7XHJcbiAgICB1aV9oaWRlRWxlbWVudEJ5SWQoXCJyZXNwb25zZUNvbnRhaW5lclwiKTtcclxufVxyXG5cclxuLyogc2hvdyBhbmQgaGlkZSBlcnJvciBtZXNzYWdlcyAqL1xyXG4vLyBlcnJvciBoYW5kbGVyc1xyXG5mdW5jdGlvbiB1aV9zaG93RXJyb3IoZXJyb3JNZXNzYWdlKSB7XHJcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImRpdkVycm9yXCIpLmlubmVySFRNTCA9IGVycm9yTWVzc2FnZTtcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXJyb3JDb250YWluZXJcIikuY2xhc3NMaXN0LnJlbW92ZSgnaGlkZGVuJyk7XHJcbn1cclxuZnVuY3Rpb24gdWlfaGlkZUVycm9yKCkge1xyXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJkaXZFcnJvclwiKS5pbm5lckhUTUwgPSBcIlwiO1xyXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJlcnJvckNvbnRhaW5lclwiKS5jbGFzc0xpc3QuYWRkKCdoaWRkZW4nKTtcclxufVxyXG5cclxuZnVuY3Rpb24gYnRuRGlzY29ubmVjdFdhbGxldCgpIHtcclxuICAgIC8vIHdpbmRvdy5rZXBscj8uc2lnbk91dChcIm9zbW9zaXMtMVwiKTtcclxuICAgIHVpX3NldFdhbGxldCh1bmRlZmluZWQpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBidG5Db25uZWN0V2FsbGV0KCkge1xyXG4gICAgYnRuQ29ubmVjdEtlcGxyX29uQ2xpY2soKTtcclxufVxyXG5mdW5jdGlvbiB1aV9zaG93RWxlbWVudEJ5SWQoZWxlbWVudElkKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGVsZW1lbnRJZCkuY2xhc3NMaXN0LnJlbW92ZSgnaGlkZGVuJyk7XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUud2FybihgdWlfc2hvd0VsZW1lbnRCeUlkOiBlbGVtZW50SWQgJHtlbGVtZW50SWR9IG5vdCBmb3VuZGApO1xyXG4gICAgfVxyXG59XHJcbmZ1bmN0aW9uIHVpX2hpZGVFbGVtZW50QnlJZChlbGVtZW50SWQpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZWxlbWVudElkKS5jbGFzc0xpc3QuYWRkKCdoaWRkZW4nKTtcclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS53YXJuKGB1aV9oaWRlRWxlbWVudEJ5SWQ6IGVsZW1lbnRJZCAke2VsZW1lbnRJZH0gbm90IGZvdW5kYCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHVzZUNvbm5lY3RlZFdhbGxldEFkZHJlc3MoKSB7XHJcbiAgICBjb25zdCBjb25uZWN0ZWRXYWxsZXRBZGRyZXNzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjb25uZWN0ZWRXYWxsZXRBZGRyZXNzXCIpLnRleHRDb250ZW50LnRyaW0oKTtcclxuXHJcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNlYXJjaFdhbGxldEFkZHJlc3NcIikudmFsdWUgPSBjb25uZWN0ZWRXYWxsZXRBZGRyZXNzO1xyXG5cclxuICAgIC8vIHVwZGF0ZSB1cmwncyBzZWFyY2ggcGFyYW1zIGZvciB3YWxsZXRBZGRyZXNzOlxyXG4gICAgY29uc3QgdXJsID0gbmV3IFVSTCh3aW5kb3cubG9jYXRpb24uaHJlZik7XHJcbiAgICB1cmwuc2VhcmNoUGFyYW1zLnNldChcIndhbGxldEFkZHJlc3NcIiwgY29ubmVjdGVkV2FsbGV0QWRkcmVzcyk7XHJcbiAgICB3aW5kb3cuaGlzdG9yeS5yZXBsYWNlU3RhdGUoe30sICcnLCB1cmwpOyAvLyB1cGRhdGUgdGhlIFVSTCB3aXRob3V0IHJlbG9hZGluZ1xyXG4gICAgXHJcbn1cclxuXHJcblxyXG5cclxuXHJcbi8vIEhlbHBlciBmdW5jdGlvbiB0byB0b2dnbGUgbG9hZGluZyBzdGF0ZVxyXG5mdW5jdGlvbiB0b2dnbGVMb2FkaW5nKGlzTG9hZGluZ1N0YXRlLCBwcm9ncmVzc01lc3NhZ2UgPSBcIlwiLCBjb250ZXh0TWVzc2FnZSA9IFwiXCIpIHtcclxuXHJcbiAgICBjb25zdCBsb2FkaW5nTWFzayA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2FkaW5nTWFzaycpO1xyXG4gICAgY29uc3QgbG9hZGluZ1Byb2dyZXNzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvYWRpbmdQcm9ncmVzcycpO1xyXG4gICAgY29uc3QgbG9hZGluZ0NvbnRleHQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9hZGluZ0NvbnRleHQnKTtcclxuICAgIGlzTG9hZGluZyA9IGlzTG9hZGluZ1N0YXRlO1xyXG4gICAgbG9hZGluZ01hc2suY2xhc3NMaXN0LnRvZ2dsZSgnYWN0aXZlJywgaXNMb2FkaW5nU3RhdGUpO1xyXG5cclxuICAgIGlmIChpc0xvYWRpbmdTdGF0ZSkge1xyXG4gICAgICAgIGxvYWRpbmdQcm9ncmVzcy50ZXh0Q29udGVudCA9IHByb2dyZXNzTWVzc2FnZSB8fCBcIkxvYWRpbmcgZGVwb3NpdHMuLi5cIjtcclxuICAgICAgICBsb2FkaW5nQ29udGV4dC50ZXh0Q29udGVudCA9IGNvbnRleHRNZXNzYWdlIHx8IFwiUGxlYXNlIHdhaXQgd2hpbGUgd2UgZmV0Y2ggeW91ciBkZXBvc2l0cy4uLlwiO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIERpc2FibGUvZW5hYmxlIGFsbCBidXR0b25zIHdoZW4gbG9hZGluZ1xyXG4gICAgY29uc3QgYnV0dG9ucyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2J1dHRvbicpO1xyXG4gICAgYnV0dG9ucy5mb3JFYWNoKGJ1dHRvbiA9PiB7XHJcbiAgICAgICAgYnV0dG9uLmRpc2FibGVkID0gaXNMb2FkaW5nU3RhdGU7XHJcbiAgICAgICAgYnV0dG9uLmNsYXNzTGlzdC50b2dnbGUoJ2xvYWRpbmcnLCBpc0xvYWRpbmdTdGF0ZSk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuLy8gSGVscGVyIHRvIGRpc3BsYXkgZXJyb3JzXHJcbmZ1bmN0aW9uIHNob3dFcnJvcihtZXNzYWdlKSB7XHJcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImVycm9yXCIpLnRleHRDb250ZW50ID0gbWVzc2FnZTtcclxufVxyXG5cclxuXHJcbi8vIEZldGNoIGFsbCBkZXBvc2l0cyBhbmQgcmV0dXJuIGFsbCBkZXBvc2l0cyBhbmQgZmlsdGVyZWQgdXNlciBkZXBvc2l0cy5cclxuYXN5bmMgZnVuY3Rpb24gZmV0Y2hBbGxEZXBvc2l0cyhhZGRyZXNzKSB7XHJcbiAgICB0b3RhbERlcG9zaXRzID0gMDtcclxuICAgIGN1cnJlbnRQYWdlID0gMTtcclxuICAgIGxldCBuZXh0S2V5ID0gbnVsbDtcclxuICAgIGNvbnN0IGxpbWl0ID0gMTAwO1xyXG4gICAgY29uc3QgdXNlckRlcG9zaXRzID0gW107XHJcbiAgICBjb25zdCBhbGxEZXBvc2l0cyA9IFtdO1xyXG5cclxuICAgIGRvIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCB1cmwgPSBgJHtMQ0RfVVJMfS9sdW0tbmV0d29yay9taWxsaW9ucy9kZXBvc2l0cz9wYWdpbmF0aW9uLmxpbWl0PSR7bGltaXR9JHtuZXh0S2V5ID8gYCZwYWdpbmF0aW9uLmtleT0ke2VuY29kZVVSSUNvbXBvbmVudChuZXh0S2V5KX1gIDogXCJcIn1gO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgRmV0Y2hpbmcgcGFnZSAke2N1cnJlbnRQYWdlfTogJHt1cmx9YCk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCk7XHJcbiAgICAgICAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEhUVFAgZXJyb3I6ICR7cmVzcG9uc2Uuc3RhdHVzfWApO1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBIVFRQIGVycm9yOiAke3Jlc3BvbnNlLnN0YXR1c31gKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coYFBhZ2UgJHtjdXJyZW50UGFnZX0gcmVzcG9uc2U6YCwgZGF0YSk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBwYWdlRGVwb3NpdHMgPSBkYXRhLmRlcG9zaXRzIHx8IFtdO1xyXG4gICAgICAgICAgICBjb25zdCBmaWx0ZXJlZERlcG9zaXRzID0gcGFnZURlcG9zaXRzLmZpbHRlcigoZGVwb3NpdCkgPT4gZGVwb3NpdC5kZXBvc2l0b3JfYWRkcmVzcyA9PT0gYWRkcmVzcyk7XHJcbiAgICAgICAgICAgIHVzZXJEZXBvc2l0cy5wdXNoKC4uLmZpbHRlcmVkRGVwb3NpdHMpO1xyXG4gICAgICAgICAgICBhbGxEZXBvc2l0cy5wdXNoKC4uLnBhZ2VEZXBvc2l0cyk7XHJcbiAgICAgICAgICAgIHRvdGFsRGVwb3NpdHMgKz0gZmlsdGVyZWREZXBvc2l0cy5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICAvLyBVcGRhdGUgbG9hZGluZyBwcm9ncmVzc1xyXG4gICAgICAgICAgICB0b2dnbGVMb2FkaW5nKHRydWUsXHJcbiAgICAgICAgICAgICAgICBgRm91bmQgJHt0b3RhbERlcG9zaXRzfSBkZXBvc2l0cyBmb3IgYWRkcmVzcy4uLmAsXHJcbiAgICAgICAgICAgICAgICBgUHJvY2Vzc2luZyBwYWdlICR7Y3VycmVudFBhZ2V9IG9mIGRlcG9zaXRzLi4uYFxyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgbmV4dEtleSA9IGRhdGEucGFnaW5hdGlvbj8ubmV4dF9rZXkgfHwgbnVsbDtcclxuICAgICAgICAgICAgY3VycmVudFBhZ2UrKztcclxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBmZXRjaGluZyBkZXBvc2l0czonLCBlcnJvcik7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRXJyb3IgZmV0Y2hpbmcgZGVwb3NpdHMgcGFnZTogJHtlcnJvci5tZXNzYWdlfWApO1xyXG4gICAgICAgIH1cclxuICAgIH0gd2hpbGUgKG5leHRLZXkpO1xyXG5cclxuICAgIGNvbnNvbGUubG9nKCdVc2VyIGRlcG9zaXRzIGNvdW50OicsIHVzZXJEZXBvc2l0cy5sZW5ndGgpO1xyXG4gICAgcmV0dXJuIHsgdXNlckRlcG9zaXRzLCBhbGxEZXBvc2l0cyB9O1xyXG59XHJcblxyXG4vLyBRdWVyeSB1c2VyIGRlcG9zaXRzXHJcbmFzeW5jIGZ1bmN0aW9uIGxpc3REZXBvc2l0cygpIHtcclxuICAgIGlmIChpc0xvYWRpbmcpIHJldHVybjtcclxuICAgIGNvbnN0IGFkZHJlc3MgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNlYXJjaFdhbGxldEFkZHJlc3NcIikudmFsdWUudHJpbSgpO1xyXG4gICAgaWYgKCFhZGRyZXNzLnN0YXJ0c1dpdGgoXCJsdW0xXCIpKSB7XHJcbiAgICAgICAgc2hvd0Vycm9yKFwiUGxlYXNlIGVudGVyIGEgdmFsaWQgTHVtIGFkZHJlc3MgKGx1bTEuLi4pXCIpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHRyeSB7XHJcbiAgICAgICAgc2hvd0Vycm9yKFwiXCIpO1xyXG4gICAgICAgIHRvZ2dsZUxvYWRpbmcodHJ1ZSwgXCJGZXRjaGluZyBnbG9iYWwgc3RhdGlzdGljcy4uLlwiLCBcIlBsZWFzZSB3YWl0Li4uXCIpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFRoZW4gZmV0Y2ggdXNlciBkZXBvc2l0c1xyXG4gICAgICAgIGNvbnN0IHsgdXNlckRlcG9zaXRzLCBhbGxEZXBvc2l0cyB9ID0gYXdhaXQgZmV0Y2hBbGxEZXBvc2l0cyhhZGRyZXNzKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBQcm9jZXNzIHBvb2wgc3RhdGlzdGljc1xyXG4gICAgICAgIGNvbnN0IHBvb2xTdGF0cyA9IGFsbERlcG9zaXRzLnJlZHVjZSgoc3RhdHMsIGRlcG9zaXQpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgcG9vbElkID0gZGVwb3NpdC5wb29sX2lkO1xyXG4gICAgICAgICAgICBsZXQgY29pbmdlY2tvSWQgPSBudWxsO1xyXG4gICAgICAgICAgICBpZiAoIXN0YXRzW3Bvb2xJZF0pIHtcclxuICAgICAgICAgICAgICAgIHN3aXRjaCAocG9vbElkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIjJcIjpcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29pbmdlY2tvSWQgPSAnY29zbW9zJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIjNcIjpcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29pbmdlY2tvSWQgPSAnY2hpaHVhaHVhLWNoYWluJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIjRcIjpcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29pbmdlY2tvSWQgPSAnb3Ntb3Npcyc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCI1XCI6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvaW5nZWNrb0lkID0gJ2luamVjdGl2ZS1wcm90b2NvbCc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvaW5nZWNrb0lkID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHN0YXRzW3Bvb2xJZF0gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcG9vbF9pZDogcG9vbElkLFxyXG4gICAgICAgICAgICAgICAgICAgIHRvdGFsX2RlcG9zaXRlZDogeyBkZW5vbTogZGVwb3NpdC5hbW91bnQuZGVub20sIGFtb3VudDogJzAnIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgZGVwb3NpdF9jb3VudDogMCxcclxuICAgICAgICAgICAgICAgICAgICBjb2luZ2Vja29faWQ6IGNvaW5nZWNrb0lkLFxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBBZGQgdG8gdG90YWwgZGVwb3NpdGVkXHJcbiAgICAgICAgICAgIHN0YXRzW3Bvb2xJZF0udG90YWxfZGVwb3NpdGVkLmFtb3VudCA9XHJcbiAgICAgICAgICAgICAgICAoQmlnSW50KHN0YXRzW3Bvb2xJZF0udG90YWxfZGVwb3NpdGVkLmFtb3VudCkgKyBCaWdJbnQoZGVwb3NpdC5hbW91bnQuYW1vdW50KSkudG9TdHJpbmcoKTtcclxuICAgICAgICAgICAgLy8gSW5jcmVtZW50IGRlcG9zaXQgY291bnRcclxuICAgICAgICAgICAgc3RhdHNbcG9vbElkXS5kZXBvc2l0X2NvdW50Kys7XHJcbiAgICAgICAgICAgIHJldHVybiBzdGF0cztcclxuICAgICAgICB9LCB7fSk7XHJcblxyXG4gICAgICAgIC8vIFVwZGF0ZSBnbG9iYWwgZGVwb3NpdHMgdGFibGVcclxuICAgICAgICBhd2FpdCB1cGRhdGVHbG9iYWxEZXBvc2l0c1RhYmxlKE9iamVjdC52YWx1ZXMocG9vbFN0YXRzKSk7XHJcblxyXG4gICAgICAgIGNvbnN0IHRib2R5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJkZXBvc2l0c0JvZHlcIik7XHJcbiAgICAgICAgdGJvZHkuaW5uZXJIVE1MID0gXCJcIjtcclxuXHJcbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhlcmUgYXJlIGRlcG9zaXRzIGZvciB0aGlzIGFkZHJlc3NcclxuICAgICAgICBpZiAodXNlckRlcG9zaXRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICBzaG93RXJyb3IoXCJObyBkZXBvc2l0cyBmb3VuZCBmb3IgdGhpcyBhZGRyZXNzLlwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRGlzcGxheSBkZXBvc2l0c1xyXG4gICAgICAgIHVzZXJEZXBvc2l0cy5mb3JFYWNoKChkZXBvc2l0KSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJvdyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0clwiKTtcclxuICAgICAgICAgICAgY29uc3QgZGVub21JbmZvID0gREVOT01JTkFUSU9OU1tkZXBvc2l0LmFtb3VudC5kZW5vbV07XHJcbiAgICAgICAgICAgIGNvbnN0IGFtb3VudCA9IGRlbm9tSW5mbyA/XHJcbiAgICAgICAgICAgICAgICBgJHtkZXBvc2l0LmFtb3VudC5hbW91bnQgLyBNYXRoLnBvdygxMCwgZGVub21JbmZvLmRlY2ltYWxzKX0gJHtkZW5vbUluZm8ubmFtZX1gIDpcclxuICAgICAgICAgICAgICAgIGAke2RlcG9zaXQuYW1vdW50fSAke2RlcG9zaXQuYW1vdW50LmRlbm9tfWA7XHJcbiAgICAgICAgICAgIHJvdy5pbm5lckhUTUwgPSBgXHJcbiAgICAgICAgICAgICAgICA8dGQ+JHtkZXBvc2l0LmRlcG9zaXRfaWR9PC90ZD5cclxuICAgICAgICAgICAgICAgIDx0ZD4ke2RlcG9zaXQucG9vbF9pZH08L3RkPlxyXG4gICAgICAgICAgICAgICAgPHRkPiR7YW1vdW50fTwvdGQ+XHJcbiAgICAgICAgICAgICAgICA8dGQ+PGJ1dHRvbiBvbmNsaWNrPVwid2l0aGRyYXdEZXBvc2l0KCcke2FkZHJlc3N9JywgJyR7ZGVwb3NpdC5wb29sX2lkfScsICcke2RlcG9zaXQuZGVwb3NpdF9pZH0nKVwiIGNsYXNzPVwiYWN0aW9uLWJ1dHRvblwiPldpdGhkcmF3PC9idXR0b24+PC90ZD5cclxuICAgICAgICAgICAgYDtcclxuICAgICAgICAgICAgdGJvZHkuYXBwZW5kQ2hpbGQocm93KTtcclxuICAgICAgICB9KTtcclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgc2hvd0Vycm9yKGBFcnJvciBmZXRjaGluZyBkZXBvc2l0czogJHtlcnJvci5tZXNzYWdlfWApO1xyXG4gICAgfSBmaW5hbGx5IHtcclxuICAgICAgICB0b2dnbGVMb2FkaW5nKGZhbHNlKTtcclxuICAgIH1cclxufVxyXG5cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHVwZGF0ZUdsb2JhbERlcG9zaXRzVGFibGUoZ2xvYmFsRGVwb3NpdHMpIHtcclxuICAgIGNvbnN0IHRib2R5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnbG9iYWxEZXBvc2l0c0JvZHlcIik7XHJcbiAgICB0Ym9keS5pbm5lckhUTUwgPSBcIlwiO1xyXG5cclxuICAgIGNvbnN0IGNvaW5nZWNrb0lkcyA9IGdsb2JhbERlcG9zaXRzLm1hcChwb29sID0+IHBvb2wuY29pbmdlY2tvX2lkKS5maWx0ZXIoaWQgPT4gaWQgIT09IG51bGwpO1xyXG4gICAgY29uc3QgdW5pcXVlQ29pbmdlY2tvSWRzID0gWy4uLm5ldyBTZXQoY29pbmdlY2tvSWRzKV07XHJcbiAgICBjb25zdCBwcmljZXMgPSBhd2FpdCBnZXRDcnlwdG9QcmljZXModW5pcXVlQ29pbmdlY2tvSWRzLnRvU3RyaW5nKCkpO1xyXG5cclxuICAgIGNvbnN0IGdsb2JhbERlcG9zaXRzV2l0aFByaWNlcyA9IGdsb2JhbERlcG9zaXRzLm1hcChwb29sID0+IHtcclxuICAgICAgICBjb25zdCBwcmljZSA9IG5ldyBCaWcocHJpY2VzW3Bvb2wuY29pbmdlY2tvX2lkXSB8fCAwKTtcclxuICAgICAgICBjb25zdCBhbW91bnQgPSBuZXcgQmlnKGZvcm1hdEFtb3VudEJ5RGVub20ocG9vbC50b3RhbF9kZXBvc2l0ZWQpKTtcclxuXHJcbiAgICAgICAgLy8gQ2FsY3VsYXRlIHdpdGggaGlnaCBwcmVjaXNpb25cclxuICAgICAgICBjb25zdCB2YWx1ZVVTRCA9IGFtb3VudC5tdWwocHJpY2UpO1xyXG4gICAgICAgIC8vIENvbnZlcnQgdG8gc3RyaW5nIHdpdGggMiBkZWNpbWFsIHBsYWNlc1xyXG4gICAgICAgIGNvbnN0IHZhbHVlVVNEUm91bmRlZCA9IHZhbHVlVVNELnRvRml4ZWQoMiwgMSk7IC8vIDEgaXMgdGhlIHJvdW5kaW5nIG1vZGUgZm9yIHJvdW5kSGFsZlVwXHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIC4uLnBvb2wsXHJcbiAgICAgICAgICAgIHZhbHVlVVNEOiB2YWx1ZVVTRFJvdW5kZWQsXHJcbiAgICAgICAgfTtcclxuICAgIH0pO1xyXG4gICAgZ2xvYmFsRGVwb3NpdHNXaXRoUHJpY2VzLmZvckVhY2goKHBvb2wpID0+IHtcclxuICAgICAgICBjb25zdCByb3cgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidHJcIik7XHJcbiAgICAgICAgcm93LmlubmVySFRNTCA9IGBcclxuICAgICAgICAgICAgPHRkPiR7cG9vbC5wb29sX2lkfTwvdGQ+XHJcbiAgICAgICAgICAgIDx0ZD4ke2Zvcm1hdEFtb3VudChwb29sLnRvdGFsX2RlcG9zaXRlZCl9PC90ZD5cclxuICAgICAgICAgICAgPHRkPiR7cG9vbC5kZXBvc2l0X2NvdW50fTwvdGQ+XHJcbiAgICAgICAgICAgIDx0ZD4ke3Bvb2wudmFsdWVVU0QgPyBwb29sLnZhbHVlVVNEIDogJ04vQSd9PC90ZD5cclxuICAgICAgICBgO1xyXG4gICAgICAgIC8vIDx0ZD4ke3Bvb2wudmFsdWVVU0QgPyBwb29sLnZhbHVlVVNELnRvRml4ZWQoMikgOiAnTi9BJ308L3RkPlxyXG4gICAgICAgIHRib2R5LmFwcGVuZENoaWxkKHJvdyk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gZ2V0Q3J5cHRvUHJpY2VzKHN0cklkcykge1xyXG5cclxuICAgIC8vIENvaW5HZWNrbyBBUEkgZW5kcG9pbnQgZm9yIGZldGNoaW5nIHByaWNlc1xyXG4gICAgY29uc3QgYXBpVXJsID0gYGh0dHBzOi8vYXBpLmNvaW5nZWNrby5jb20vYXBpL3YzL3NpbXBsZS9wcmljZT9pZHM9JHtzdHJJZHN9JnZzX2N1cnJlbmNpZXM9dXNkYDtcclxuXHJcbiAgICB0cnkge1xyXG4gICAgICAgIC8vIEZldGNoIHRoZSBwcmljZSBkYXRhXHJcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChhcGlVcmwpO1xyXG4gICAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdOZXR3b3JrIHJlc3BvbnNlIHdhcyBub3Qgb2snKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcclxuXHJcbiAgICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBVU0QgdmFsdWUgZm9yIGVhY2ggY3J5cHRvY3VycmVuY3lcclxuICAgICAgICBjb25zdCBwcmljZXMgPSBPYmplY3Qua2V5cyhkYXRhKS5yZWR1Y2UoKGFjYywga2V5KSA9PiB7XHJcbiAgICAgICAgICAgIGFjY1trZXldID0gZGF0YVtrZXldLnVzZDtcclxuICAgICAgICAgICAgcmV0dXJuIGFjYztcclxuICAgICAgICB9LCB7fSk7XHJcblxyXG4gICAgICAgIHJldHVybiBwcmljZXM7XHJcblxyXG5cclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZmV0Y2hpbmcgcHJpY2VzOicsIGVycm9yKTtcclxuICAgICAgICB0aHJvdyBlcnJvcjtcclxuICAgIH1cclxufVxyXG5cclxuXHJcbmZ1bmN0aW9uIGZvcm1hdEFtb3VudChhbW91bnQpIHtcclxuICAgIGNvbnN0IGRlbm9tSW5mbyA9IERFTk9NSU5BVElPTlNbYW1vdW50LmRlbm9tXTtcclxuICAgIHJldHVybiBkZW5vbUluZm8gP1xyXG4gICAgICAgIGAke2Ftb3VudC5hbW91bnQgLyBNYXRoLnBvdygxMCwgZGVub21JbmZvLmRlY2ltYWxzKX0gJHtkZW5vbUluZm8ubmFtZX1gIDpcclxuICAgICAgICBgJHthbW91bnQuYW1vdW50fSAke2Ftb3VudC5kZW5vbX1gO1xyXG59XHJcblxyXG5mdW5jdGlvbiBmb3JtYXRBbW91bnRCeURlbm9tKGFtb3VudCkge1xyXG4gICAgY29uc3QgZGVub21JbmZvID0gREVOT01JTkFUSU9OU1thbW91bnQuZGVub21dO1xyXG4gICAgcmV0dXJuIGRlbm9tSW5mbyA/XHJcbiAgICAgICAgYCR7YW1vdW50LmFtb3VudCAvIE1hdGgucG93KDEwLCBkZW5vbUluZm8uZGVjaW1hbHMpfWAgOlxyXG4gICAgICAgIGAke2Ftb3VudC5hbW91bnR9YDtcclxufVxyXG5cclxuLy8gV2l0aGRyYXcgYSBkZXBvc2l0XHJcbmFzeW5jIGZ1bmN0aW9uIHdpdGhkcmF3RGVwb3NpdChkZXBvc2l0b3IsIHBvb2xJZCwgZGVwb3NpdElkKSB7XHJcbiAgICBpZiAoaXNMb2FkaW5nKSByZXR1cm47XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgICBzaG93RXJyb3IoXCJcIik7XHJcbiAgICAgICAgdG9nZ2xlTG9hZGluZyh0cnVlLCBcIlByZXBhcmluZyB3aXRoZHJhd2FsLi4uXCIsIFwiUGxlYXNlIGNvbmZpcm0gdGhlIHRyYW5zYWN0aW9uIGluIHlvdXIgd2FsbGV0XCIpO1xyXG5cclxuICAgICAgICAvLyBFbnN1cmUgS2VwbHIgaXMgYXZhaWxhYmxlXHJcbiAgICAgICAgaWYgKCF3aW5kb3cua2VwbHIpIHtcclxuICAgICAgICAgICAgc2hvd0Vycm9yKFwiS2VwbHIgd2FsbGV0IG5vdCBkZXRlY3RlZC4gUGxlYXNlIGluc3RhbGwgS2VwbHIgZXh0ZW5zaW9uLlwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRW5hYmxlIEtlcGxyIGZvciBMdW0gTmV0d29ya1xyXG4gICAgICAgIGF3YWl0IHdpbmRvdy5rZXBsci5lbmFibGUoQ0hBSU5fSUQpO1xyXG4gICAgICAgIGNvbnN0IG9mZmxpbmVTaWduZXIgPSB3aW5kb3cua2VwbHIuZ2V0T2ZmbGluZVNpZ25lcihDSEFJTl9JRCk7XHJcbiAgICAgICAgY29uc3QgYWNjb3VudHMgPSBhd2FpdCBvZmZsaW5lU2lnbmVyLmdldEFjY291bnRzKCk7XHJcblxyXG4gICAgICAgIGlmIChhY2NvdW50c1swXS5hZGRyZXNzICE9PSBkZXBvc2l0b3IpIHtcclxuICAgICAgICAgICAgc2hvd0Vycm9yKFwiS2VwbHIgYWRkcmVzcyBkb2VzIG5vdCBtYXRjaCBwcm92aWRlZCBhZGRyZXNzLlwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gR2V0IGFjY291bnQgZGV0YWlsc1xyXG4gICAgICAgIGNvbnN0IGFjY291bnRSZXNwb25zZSA9IGF3YWl0IGZldGNoKFxyXG4gICAgICAgICAgICBgJHtMQ0RfVVJMfS9jb3Ntb3MvYXV0aC92MWJldGExL2FjY291bnRzLyR7ZGVwb3NpdG9yfWBcclxuICAgICAgICApO1xyXG4gICAgICAgIGNvbnN0IGFjY291bnREYXRhID0gYXdhaXQgYWNjb3VudFJlc3BvbnNlLmpzb24oKTtcclxuICAgICAgICBjb25zdCBhY2NvdW50ID0gYWNjb3VudERhdGEuYWNjb3VudDtcclxuICAgICAgICBjb25zdCBzZXF1ZW5jZSA9IGFjY291bnQuc2VxdWVuY2U7XHJcbiAgICAgICAgY29uc3QgYWNjb3VudE51bWJlciA9IGFjY291bnQuYWNjb3VudF9udW1iZXI7XHJcblxyXG4gICAgICAgIC8vIENvbnN0cnVjdCBNc2dXaXRoZHJhd0RlcG9zaXRcclxuICAgICAgICBjb25zdCBtc2cgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwibHVtLW5ldHdvcmsvbWlsbGlvbnMvTXNnV2l0aGRyYXdEZXBvc2l0XCIsXHJcbiAgICAgICAgICAgIHZhbHVlOiB7XHJcbiAgICAgICAgICAgICAgICBkZXBvc2l0b3JfYWRkcmVzczogZGVwb3NpdG9yLFxyXG4gICAgICAgICAgICAgICAgcG9vbF9pZDogcG9vbElkLFxyXG4gICAgICAgICAgICAgICAgZGVwb3NpdF9pZDogZGVwb3NpdElkLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vIEZlZVxyXG4gICAgICAgIGNvbnN0IGZlZSA9IHtcclxuICAgICAgICAgICAgYW1vdW50OiBbe1xyXG4gICAgICAgICAgICAgICAgZGVub206IERFTk9NLFxyXG4gICAgICAgICAgICAgICAgYW1vdW50OiBNYXRoLmNlaWwoR0FTX0xJTUlUICogcGFyc2VGbG9hdChHQVNfUFJJQ0UpKS50b1N0cmluZygpLFxyXG4gICAgICAgICAgICB9XSxcclxuICAgICAgICAgICAgZ2FzOiBHQVNfTElNSVQudG9TdHJpbmcoKSxcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvLyBTaWduIHRyYW5zYWN0aW9uXHJcbiAgICAgICAgY29uc3Qgc2lnbkRvYyA9IHtcclxuICAgICAgICAgICAgYm9keToge1xyXG4gICAgICAgICAgICAgICAgbWVzc2FnZXM6IFttc2ddLFxyXG4gICAgICAgICAgICAgICAgbWVtbzogXCJcIixcclxuICAgICAgICAgICAgICAgIHRpbWVvdXRfaGVpZ2h0OiBcIjBcIixcclxuICAgICAgICAgICAgICAgIGV4dGVuc2lvbl9vcHRpb25zOiBbXSxcclxuICAgICAgICAgICAgICAgIG5vbl9jcml0aWNhbF9leHRlbnNpb25fb3B0aW9uczogW10sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGF1dGhfaW5mbzoge1xyXG4gICAgICAgICAgICAgICAgc2lnbmVyX2luZm9zOiBbe1xyXG4gICAgICAgICAgICAgICAgICAgIHB1YmxpY19rZXk6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJ0ZW5kZXJtaW50L1B1YktleVNlY3AyNTZrMVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBrZXk6IGFjY291bnRzWzBdLnB1YmtleSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIG1vZGVfaW5mbzogeyBzaW5nbGU6IHsgbW9kZTogXCJTSUdOX01PREVfRElSRUNUXCIgfSB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHNlcXVlbmNlOiBzZXF1ZW5jZS50b1N0cmluZygpLFxyXG4gICAgICAgICAgICAgICAgfV0sXHJcbiAgICAgICAgICAgICAgICBmZWUsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGNoYWluX2lkOiBDSEFJTl9JRCxcclxuICAgICAgICAgICAgYWNjb3VudF9udW1iZXI6IGFjY291bnROdW1iZXIudG9TdHJpbmcoKSxcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBjb25zdCBzaWduZWQgPSBhd2FpdCB3aW5kb3cua2VwbHIuc2lnbkRpcmVjdChDSEFJTl9JRCwgZGVwb3NpdG9yLCB7XHJcbiAgICAgICAgICAgIGJvZHlCeXRlczogc2VyaWFsaXplQm9keShzaWduRG9jLmJvZHkpLFxyXG4gICAgICAgICAgICBhdXRoSW5mb0J5dGVzOiBzZXJpYWxpemVBdXRoSW5mbyhzaWduRG9jLmF1dGhfaW5mbyksXHJcbiAgICAgICAgICAgIGNoYWluSWQ6IENIQUlOX0lELFxyXG4gICAgICAgICAgICBhY2NvdW50TnVtYmVyOiBhY2NvdW50TnVtYmVyLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBDb25zdHJ1Y3QgdHJhbnNhY3Rpb25cclxuICAgICAgICBjb25zdCB0eCA9IHtcclxuICAgICAgICAgICAgc2lnbmF0dXJlczogW3NpZ25lZC5zaWduYXR1cmUuc2lnbmF0dXJlXSxcclxuICAgICAgICAgICAgYm9keTogc2lnbmVkLnNpZ25lZC5ib2R5LFxyXG4gICAgICAgICAgICBhdXRoX2luZm86IHNpZ25lZC5zaWduZWQuYXV0aF9pbmZvLFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vIEJyb2FkY2FzdCB0cmFuc2FjdGlvblxyXG4gICAgICAgIGNvbnN0IGJyb2FkY2FzdFJlc3BvbnNlID0gYXdhaXQgZmV0Y2goYCR7UlBDX1VSTH0vdHhzYCwge1xyXG4gICAgICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxyXG4gICAgICAgICAgICBoZWFkZXJzOiB7IFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0sXHJcbiAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICAgICAgICAgIHR4LFxyXG4gICAgICAgICAgICAgICAgbW9kZTogXCJCUk9BRENBU1RfTU9ERV9CTE9DS1wiLFxyXG4gICAgICAgICAgICB9KSxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgY29uc3QgYnJvYWRjYXN0UmVzdWx0ID0gYXdhaXQgYnJvYWRjYXN0UmVzcG9uc2UuanNvbigpO1xyXG5cclxuICAgICAgICBpZiAoYnJvYWRjYXN0UmVzdWx0LnJlc3VsdD8uY29kZSAhPT0gMCkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYnJvYWRjYXN0UmVzdWx0LnJlc3VsdD8ucmF3X2xvZyB8fCBcIlRyYW5zYWN0aW9uIGZhaWxlZFwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGFsZXJ0KGBXaXRoZHJhd2FsIHN1Y2Nlc3NmdWwhIFR4IEhhc2g6ICR7YnJvYWRjYXN0UmVzdWx0LnJlc3VsdC50eGhhc2h9YCk7XHJcbiAgICAgICAgbGlzdERlcG9zaXRzKCk7IC8vIFJlZnJlc2ggZGVwb3NpdCBsaXN0XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIHNob3dFcnJvcihgRXJyb3Igd2l0aGRyYXdpbmcgZGVwb3NpdDogJHtlcnJvci5tZXNzYWdlfWApO1xyXG4gICAgfSBmaW5hbGx5IHtcclxuICAgICAgICB0b2dnbGVMb2FkaW5nKGZhbHNlKTtcclxuICAgIH1cclxufVxyXG5cclxuLy8gSGVscGVyIHRvIHNlcmlhbGl6ZSB0cmFuc2FjdGlvbiBib2R5XHJcbmZ1bmN0aW9uIHNlcmlhbGl6ZUJvZHkoYm9keSkge1xyXG4gICAgcmV0dXJuIEJ1ZmZlci5mcm9tKEpTT04uc3RyaW5naWZ5KGJvZHkpKS50b1N0cmluZyhcImJhc2U2NFwiKTtcclxufVxyXG5cclxuLy8gSGVscGVyIHRvIHNlcmlhbGl6ZSBhdXRoIGluZm9cclxuZnVuY3Rpb24gc2VyaWFsaXplQXV0aEluZm8oYXV0aEluZm8pIHtcclxuICAgIHJldHVybiBCdWZmZXIuZnJvbShKU09OLnN0cmluZ2lmeShhdXRoSW5mbykpLnRvU3RyaW5nKFwiYmFzZTY0XCIpO1xyXG59XHJcblxyXG4vLyAvLyBJbml0aWFsaXplIEtlcGxyIGNoYWluIGNvbmZpZ3VyYXRpb25cclxuYXN5bmMgZnVuY3Rpb24gc3VnZ2VzdENoYWluTHVtKCkge1xyXG4gICAgaWYgKCF3aW5kb3cua2VwbHIpIHJldHVybjtcclxuICAgIGF3YWl0IHdpbmRvdy5rZXBsci5leHBlcmltZW50YWxTdWdnZXN0Q2hhaW4oe1xyXG4gICAgICAgIGNoYWluSWQ6IENIQUlOX0lELFxyXG4gICAgICAgIGNoYWluTmFtZTogJ0x1bSBOZXR3b3JrJyxcclxuICAgICAgICBycGM6IFJQQ19VUkwsXHJcbiAgICAgICAgcmVzdDogTENEX1VSTCxcclxuICAgICAgICBiaXA0NDoge1xyXG4gICAgICAgICAgICBjb2luVHlwZTogMTE4LFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYmVjaDMyQ29uZmlnOiB7XHJcbiAgICAgICAgICAgIGJlY2gzMlByZWZpeEFjY0FkZHI6IFwibHVtXCIsXHJcbiAgICAgICAgICAgIGJlY2gzMlByZWZpeEFjY1B1YjogXCJsdW1cIiArIFwicHViXCIsXHJcbiAgICAgICAgICAgIGJlY2gzMlByZWZpeFZhbEFkZHI6IFwibHVtXCIgKyBcInZhbG9wZXJcIixcclxuICAgICAgICAgICAgYmVjaDMyUHJlZml4VmFsUHViOiBcImx1bVwiICsgXCJ2YWxvcGVycHViXCIsXHJcbiAgICAgICAgICAgIGJlY2gzMlByZWZpeENvbnNBZGRyOiBcImx1bVwiICsgXCJ2YWxjb25zXCIsXHJcbiAgICAgICAgICAgIGJlY2gzMlByZWZpeENvbnNQdWI6IFwibHVtXCIgKyBcInZhbGNvbnNwdWJcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY3VycmVuY2llczogW3tcclxuICAgICAgICAgICAgY29pbkRlbm9tOiBERU5PTSxcclxuICAgICAgICAgICAgY29pbk1pbmltYWxEZW5vbTogREVOT00sXHJcbiAgICAgICAgICAgIGNvaW5EZWNpbWFsczogNixcclxuICAgICAgICB9XSxcclxuICAgICAgICBmZWVDdXJyZW5jaWVzOiBbe1xyXG4gICAgICAgICAgICBjb2luRGVub206IERFTk9NLFxyXG4gICAgICAgICAgICBjb2luTWluaW1hbERlbm9tOiBERU5PTSxcclxuICAgICAgICAgICAgY29pbkRlY2ltYWxzOiA2LFxyXG4gICAgICAgIH1dLFxyXG4gICAgICAgIHN0YWtpbmc6IHtcclxuICAgICAgICAgICAgYm9uZERlbm9tOiBERU5PTSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHZhbGlkYXRvcjoge1xyXG4gICAgICAgICAgICBwdWJLZXlUeXBlczogWydzZWNwMjU2azEnXSxcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufSJdfQ==
