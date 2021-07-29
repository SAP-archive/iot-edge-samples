*** Settings ***
Documentation     Navigates to the work order tile return $('label:contains(' + 10020 + ')').parent().parent().children('td.sapMListTblSelCol').children('div.sapMLIBSelectM') Conclude Close Browser
Resource          ../../test-global/resource.robot

*** Variables ***
${TileText}                     Create Work Order
${AppTitle}                     Create Work Order

${TIMEOUT}          10sec
${RETRY_RATE}       0.05sec

${AUFNR}            \

${AddMaterialButton}            span[id*=materialAddButton]
${visibleDateDiv}    $('div.sapUiCal.sapUiShd[style*=visible]')
${DialogErrorMessageButton}     span[id*=dialog-messages-button]
${CloseErrorMessageButton}     button[title=Close]

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
${TimePickerOk}                 span:contains('OK')[Class=sapMBtnContent]:not([id*=breakdownOk])
${SaveWorkorder}                span[id*=save-button]
${MessageToastSuccess}          div:contains('Saved')
${MessageToastFail}             div:contains('Please')
${WorkorderView}                span:contains('Order')
${Home}                         a[id*=homeBtn]

*** Keywords ***
Click Home Button
    Click Element    jquery=${Home}
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

*** Test Cases ***
Start Test
    Open Browser To Start
    Log In

Navigate to Config and Change Config to N
    Change Global Sync Option Config       WOCreateInitialOperation    N

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
    Input Text                          jquery=${InputDescription}          WO Without Initial OP
    Wait For    Click Save Workorder
    Wait Until Page Contains Element    jquery=${MessageToastSuccess}

Navigate to the new WO (1)
    ${AUFNR} =      Execute Javascript      return (/[(][^)]*/.exec($('div.sapMMessageToast').text()))[0].substring(1)
    Wait Until Page Contains Element    jquery=${WorkorderView}
    #Execute Javascript    window.location.hash = "#depWorkorderop-enter"
    Change App    Work Order Operations
    Wait Until Element Is Visible    id=dep-fiori-workorderop-enter--tableTitle
    Click Element       id=dep-fiori-workorderop-enter--filter-bar-btnShowHide-content
    Input Text          id=dep-fiori-workorderop-enter--workorderNumber-inner     ${AUFNR}
    Click Element       id=dep-fiori-workorderop-enter--filter-bar-btnGo
    Wait Until Element Is Visible    jquery=#dep-fiori-workorderop-enter--enter-workorder-table-tblBody label:contains(${AUFNR})
    Click Element       jquery=#dep-fiori-workorderop-enter--enter-workorder-table-tblBody label:contains(${AUFNR})

Verify no Operation was created
    Wait Until Page Contains        No Work Order Operations
    # We need to check again in case the ajax is slow
    Sleep   1
    Wait Until Page Contains        No Work Order Operations

Navigate to Config and Change Config to Y
    Change Global Sync Option Config       WOCreateInitialOperation    Y

Navigate to App (2)
    Change App    Create Work Order
    #Execute Javascript    window.location.hash = "#depWorkorder-create"
    Wait For Condition      return $("."+"sapUshellHeadTitle").text() === "Create Work Order"
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
    Input Text                          jquery=${InputDescription}          WO With Initial Operation
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

Verify an Operation was created
    Wait Until Element is Visible   jquery=#dep-fiori-workorderop-edit--woOperationsList-tblBody label:contains(0010)

#Conclude
 #   Close Browser
