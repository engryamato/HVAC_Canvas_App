# Canvas Validation Context

This document outlines the purpose, data points, and states of all UI elements found in `Canvas_Validation.pen`. It serves as a reference for developers implementing the engineering rules validation panel.

## 1. Validation Panel Shell (`Canvas_Validation`)
The dedicated right sidebar tab intended for surfacing engineering, design, and calculation warnings and errors. Displays structured feedback regarding the drawn system's validity.

## 2. Validation Content Wrapper
The structural container ensuring consistent layout, spacing, and scrolling of validation alerts and options.

## 3. Validation Summary Section
Usually contains high-level aggregate information, such as the total count of outstanding errors vs warnings. Gives the user a quick glance at the overall health rating of the current design.

## 4. Validation Issues Section
The core dynamic area listing detailed individual validation checks. Expect to populate this list dynamically with specific error messages, the precise elements they belong to, and visual severity indicators.

## 5. Validation Actions Section
Houses global resolution options. Example actions may include overriding warnings, triggering full system recalculations, exporting error logs, or jumping out of validation mode.
