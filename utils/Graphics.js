"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.polarToCartesian = polarToCartesian;
exports.arcCommands = arcCommands;
exports.translateEndAngle = translateEndAngle;
// (C) Copyright 2014-2016 Hewlett Packard Enterprise Development LP

var baseUnit = exports.baseUnit = 24;

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  var angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians)
  };
};

function arcCommands(centerX, centerY, radius, startAngle, endAngle) {
  // handle that we can't draw a complete circle
  if (endAngle - startAngle >= 360) {
    endAngle = startAngle + 359.99;
  }
  var start = polarToCartesian(centerX, centerY, radius, endAngle);
  var end = polarToCartesian(centerX, centerY, radius, startAngle);
  var arcSweep = endAngle - startAngle <= 180 ? "0" : "1";
  var d = ["M", start.x, start.y, "A", radius, radius, 0, arcSweep, 0, end.x, end.y].join(" ");
  return d;
};

function translateEndAngle(startAngle, anglePer, value) {
  return Math.min(360, Math.max(0, startAngle + anglePer * value));
};