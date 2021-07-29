*** Settings ***
Documentation     Navigates to the work order tile
Resource          ../../test-global/resource.robot

*** Variables ***
${TileText}                     Create Work Order
${AppTitle}                     Create Work Order

${InputDescription}             input[id*=inputDesc]
${EquipmentButton}              span[id*=equipmentSelect]
${EquipmentFirstElement}        tbody[id*=equipmentTable] > tr:first
${MaintenanceCombo}             div[id*=workorderTypeSelect]
${MaintenanceFirstElement}      li[id*=workorderTypeSelect]
${WorkcenterCombo}              div[id*=workcenterSelect]
${WorkcenterFirstElement}       li[id*=workcenterSelect]
${PriorityCombo}                div[id*=prioritySelect]
${PriorityFirstElement}         li[id*=prioritySelect]
${PrimaryDatePicker}            span[id*=inputDate]
${BreakdownCheckbox}            div[id*=breakdownCheckbox]
${BreakdownDatePicker}          div.malfunctionDate > div
${BreakdownTimePicker}          div.malfunctionTime > div
${TimePickerOk}                 span:contains('OK')[Class=sapMBtnContent]:not([id*=breakdownOk])
${BreakdownDialogOk}            span:contains('OK')[Class=sapMBtnContent][id*=breakdownOk]
${BreakdownDialogCancel}        span:contains('Cancel')[Class=sapMBtnContent]
${SaveWorkorder}                span[id*=save-button]
${MessageToastSuccess}          div:contains('Saved')
${MessageToastFail}             div:contains('Please')
${WorkorderView}                span:contains('Order')

*** Keywords ***
Click Equipment Button
    Click Element                       jquery=${EquipmentButton}
Click Equipment First Element
    Click Element                       jquery=${EquipmentFirstElement}
Click Maintenance
    Click Element                       jquery=${MaintenanceCombo}
Click Maintenance First Element
    Click Element                       jquery=${MaintenanceFirstElement}
Click Workcenter
    Click Element                       jquery=${WorkcenterCombo}
Click Workcenter First Element
    Click Element                       jquery=${WorkcenterFirstElement}
Click Priority
    Click Element                       jquery=${PriorityCombo}
Click Priority First Element
    Click Element                       jquery=${PriorityFirstElement}
Click Date Picker
    Click Element                       jquery=${PrimaryDatePicker}
Click Breakdown Checkbox
    Click Element                       jquery=${BreakdownCheckbox}
Click Breakdown Dialog Ok
    Click Element                       jquery=${BreakdownDialogOk}
Click Breakdown Dialog Cancel
    Click Element                       jquery=${BreakdownDialogCancel}
Click Breakdown Date Picker
    Click Element                       jquery=${BreakdownDatePicker}
Click Breakdown Date Chosen
    Click Element                       jquery=${BreakdownDateChosen}
Click Breakdown Time Picker
    Click Element                       jquery=${BreakdownTimePicker}
Click Breakdown Time Picker Ok
    Click Element                       jquery=${TimePickerOk}
Click Save Workorder
    Click Element                       jquery=${SaveWorkorder}

*** Test Cases ***
Start Test
    Open Browser To Start
    Log In

Navigate to App
    Click Launchpad Tile And Entering

Choose Equipment
    Wait For    Click Equipment Button
    Wait For    Click Equipment First Element

Choose Maintenance Activity Type
    Wait For    Click Maintenance
    Wait For    Click Maintenance First Element

Choose Workcenter
    Wait For    Click Workcenter
    Wait For    Click Workcenter First Element

Choose Priority
    Wait For    Click Priority
    Wait For    Click Priority First Element

Pick Date
    Wait For    Click Date Picker
    Wait Until Keyword Succeeds    ${TIMEOUT}    ${RETRY_RATE}    Pick Date    2019    'December'   31

Breakdown Test
    Wait For    Click Breakdown Checkbox

Breakdown Date Picker
    Wait For    Click Breakdown Date Picker
    Wait Until Keyword Succeeds    ${TIMEOUT}    ${RETRY_RATE}    Pick Date    2019    'December'   30

Breakdown Time Picker
    Wait For    Click Breakdown Time Picker
    Wait For    Click Breakdown Time Picker Ok

Save Invalid Workorder
    Wait For    Click Save Workorder
    Wait Until Page Contains Element    jquery=${MessageToastFail}

Type Description
    Input Text                          jquery=${InputDescription}          Test Description

Save Workorder
    Wait For    Click Save Workorder
    Wait Until Page Contains Element    jquery=${MessageToastSuccess}
    Wait Until Page Contains Element    jquery=${WorkorderView}

Finish Tests
    Conclude
