*** Settings ***
Documentation     Navigates to the work order tile return $('label:contains(' + 10020 + ')').parent().parent().children('td.sapMListTblSelCol').children('div.sapMLIBSelectM') Conclude Close Browser
Resource          ../../test-global/resource.robot

*** Variables ***
${TileText}                     Create Work Order
${AppTitle}                     Create Work Order

${TIMEOUT}          10sec
${RETRY_RATE}       0.05sec

${AUFNR}            \

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
${PrimaryDateChosen}            div.sapUiCalItems > div:first-child > div:first-child
${SaveWorkorder}                span[id*=save-button]
${MessageToastSuccess}          div:contains('Saved')
${WorkorderView}                span:contains('Order')
${firstOperationShortText}      input[id*=dep-fiori-workorderop-edit--shortTextInput]
${firstControlKey}              label[id*=dep-fiori-workorderop-edit--opControlKeySelect]
${firstWorkCenter}              label[id*=dep-fiori-workorderop-edit--opWorkcenterSelect]
${firstOPNumLabel}              label[id*=dep-fiori-workorderop-edit--operationId]
${plannedHoursLabel}            input[id*=dep-fiori-workorderop-create--txtDAUNO]
${Home}                         a[id*=homeBtn]



*** Keywords ***
Change Config To Specific
    Change Global Sync Option Config    OperationDefaultControlKey    ZINT
    Change Global Sync Option Config    OperationDefaultOperationShortText    Hello World
    Change Global Sync Option Config    OperationDefaultWorkCenter    MECH
    Change Global Sync Option Config    OperationDefaultPlannedHours    3
Change Config To Workorder
    Change Global Sync Option Config    OperationDefaultControlKey    EXT2
    Change Global Sync Option Config    OperationDefaultOperationShortText    @workorderShortText
    Change Global Sync Option Config    OperationDefaultWorkCenter    @workorderWorkCenter
    Change Global Sync Option Config    OperationDefaultPlannedHours    15
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
Click Date Chosen
    Click Element                       jquery=${PrimaryDateChosen}
Click Save Workorder
    Click Element                       jquery=${SaveWorkorder}
Input Description
    Input Text                          jquery=${InputDescription}          Hello World

*** Test Cases ***
Start Test
    Open Browser To Start
    Log In

Navigate to Config and Change Config (1)
    Change Config To Specific

Navigate to App (1)
    #Execute Javascript    window.location.hash = "#depWorkorder-create"
    Click Launchpad Tile And Entering
    Wait Until Element Is Visible    id=dep-fiori-workorder-create--save-button-inner

Create Workorder (1)
    Wait For    Click Equipment Button
    Wait For    Click Equipment First Element
    Wait For    Click Maintenance
    Wait For    Click Maintenance First Element
    Wait For    Click Workcenter
    Wait For    Click Workcenter First Element
    Wait For    Click Priority
    Wait For    Click Priority First Element
    Wait For    Input Description
    Wait For    Click Save Workorder
    Wait Until Page Contains Element    jquery=${MessageToastSuccess}

Navigate to the new WO (1)
    ${AUFNR} =          Execute Javascript      return (/[(][^)]*/.exec($('div.sapMMessageToast').text()))[0].substring(1)
    Wait Until Page Contains Element    jquery=${WorkorderView}
    #Execute Javascript    window.location.hash = "#depWorkorderop-enter"
    Change App    Work Order Operations
    Wait Until Element Is Visible    id=dep-fiori-workorderop-enter--tableTitle
    Click Element       id=dep-fiori-workorderop-enter--filter-bar-btnShowHide-content
    Input Text          id=dep-fiori-workorderop-enter--workorderNumber-inner     ${AUFNR}
    Click Element       id=dep-fiori-workorderop-enter--filter-bar-btnGo
    Wait Until Element Is Visible    jquery=#dep-fiori-workorderop-enter--enter-workorder-table-tblBody label:contains(${AUFNR})
    Click Element       jquery=#dep-fiori-workorderop-enter--enter-workorder-table-tblBody label:contains(${AUFNR})

Verify an Operation was created and all fields are correct
    Wait Until Element is Visible   jquery=#dep-fiori-workorderop-edit--woOperationsList-tblBody label:contains(0010)
    Textfield Value Should Be          jquery=${firstOperationShortText}     Hello World
    Element Text Should Be          jquery=${firstControlKey}             ZINT
    Element Text Should Be          jquery=${firstWorkCenter}             MECH

Click into an Operation
    Click Element                   jquery=${firstOPNumLabel}
    Wait For Condition      return $('input[id*=dep-fiori-workorderop-create--txtDAUNO]').val() === "3"

Navigate to Config and Change Config (2)
    Change Config To Workorder

Navigate to App (2)
    #Execute Javascript    window.location.hash = "#depWorkorder-create"
    #Wait For Condition      return $("."+"sapUshellHeadTitle").text() === "Create Work Order"
    Change App    Create Work Order
    Wait Until Element Is Visible    id=dep-fiori-workorder-create--save-button-inner

Create Workorder (2)
    Wait For    Click Equipment Button
    Wait For    Click Equipment First Element
    Wait For    Click Maintenance
    Wait For    Click Maintenance First Element
    Wait For    Click Workcenter
    Wait For    Click Workcenter First Element
    Wait For    Click Priority
    Wait For    Click Priority First Element
    Input Text                          jquery=${InputDescription}          Bye World
    Wait For    Click Save Workorder
    Wait Until Page Contains Element    jquery=${MessageToastSuccess}
    Wait Until Page Contains Element    jquery=${WorkorderView}

Navigate to the new WO (2)
    ${AUFNR} =      Execute Javascript      return (/[(][^)]*/.exec($('div.sapMMessageToast').text()))[0].substring(1)
    #Execute Javascript    window.location.hash = "#depWorkorderop-enter"
    Change App    Work Order Operations
    Wait Until Element Is Visible    id=dep-fiori-workorderop-enter--tableTitle
    Click Element       id=dep-fiori-workorderop-enter--filter-bar-btnShowHide-content
    Input Text          id=dep-fiori-workorderop-enter--workorderNumber-inner     ${AUFNR}
    Click Element       id=dep-fiori-workorderop-enter--filter-bar-btnGo
    Wait Until Element Is Visible    jquery=#dep-fiori-workorderop-enter--enter-workorder-table-tblBody label:contains(${AUFNR})
    Click Element       jquery=#dep-fiori-workorderop-enter--enter-workorder-table-tblBody label:contains(${AUFNR})

Verify an Operation was created and all fields are correct (2)
    Wait Until Element is Visible   jquery=#dep-fiori-workorderop-edit--woOperationsList-tblBody label:contains(0010)
    Textfield Value Should Be          jquery=${firstOperationShortText}     Bye World
    Element Text Should Be          jquery=${firstControlKey}             EXT2
    Element Text Should Be          jquery=${firstWorkCenter}             ARM

Click into an Operation (2)
    Click Element                   jquery=${firstOPNumLabel}
    Wait For Condition      return $('input[id*=dep-fiori-workorderop-create--txtDAUNO]').val() === "15"

Conclude
    Close Browser
