*** Settings ***
Documentation     Navigates to the measuringpoints tile
Resource          ../../test-global/resource.robot

*** Variables ***
${TileText}     Enter Measuring Point
${AppTitle}     Measuring Points

${ExpandFilter}         id=dep-fiori-measuringpoints-enter--filter-bar-btnShowHide
${TimePickerText}       dep-fiori-measuringpoints--enter-measuring-point-table-listUl tr:nth-child(2) .sapMInputBaseInner[placeholder="HH:mm"]

${BackButton}           backBtn[aria-label="Go Back"]

${MeasuringPointShowFilterBar}      dep-fiori-measuringpoints-enter--filter-bar-btnShowHide
${MeasuringPointFilterTextField}    dep-fiori-measuringpoints-enter--pointInput-inner
${GoButton}                         div.sapUiCompFilterBarToolbar .sapMBtnInverted
${DateFilterTextField}              dep-fiori-measuringpoints-enter--FilterDate-inner
${DescriptionFilterTextField}       dep-fiori-measuringpoints-enter--descOfMP-inner
# ${ClearButtonInFilterBar}           footer.sapMFooter-CTX[data-sap-ui-fastnavgroup="true"][role="heading"] button:nth-child(3)
${ClearButtonInFilterBar}           id=dep-fiori-measuringpoints-enter--filter-bar-btnClearFilterDialog-content
${FilterButton}                     id=dep-fiori-measuringpoints-enter--filter-bar-btnFilters
${GoButtonInTheFilterDialog}        id=dep-fiori-measuringpoints-enter--filter-bar-btnGoFilterDialog-content

*** Keywords ***
# keywords local to this file
Click Clear Button
    Wait Then Click Element         ${ClearButtonInFilterBar}

Click The Back Button
    Click Element                   jquery=#${BackButton}

Click Measuring Point Show Filter Bar
    Click Element                   id=${MeasuringPointShowFilterBar}

*** Test Cases ***
Start Test
    Open Browser To Start
    Log In

Navigate to App
    Click Launchpad Tile And Entering

Input Measuring Point Filter Information
    Wait For                        Click Measuring Point Show Filter Bar
    Wait Until Element Is Visible   id=${MeasuringPointFilterTextField}
    Input Text                      id=${MeasuringPointFilterTextField}    182
    Press Key                       id=${MeasuringPointFilterTextField}    \\13
    Wait For Condition              return $('#'+'${MeasuringPointFilterTextField}').val() === "182";

Input Date Filter Information
    Input Text              id=${DateFilterTextField}    Apr 5, 2015
    Press Key               id=${DateFilterTextField}    \\13
    Wait For Condition      return $('#'+'${DateFilterTextField}').val() === "Apr 5, 2015";

Input Description Filter Information
    Input Text              id=${DescriptionFilterTextField}    DWK
    Press Key               id=${DescriptionFilterTextField}     \\13
    Wait For Condition      return $('#'+'${DescriptionFilterTextField}').val() === "DWK";

Do Filter Job
    Wait Until Page Contains Element    css=${GoButton}
    Click Element                       css=${GoButton}

Then Clean All The Filter Information
    Click Element                       ${FilterButton}
    Wait Until Element Is Visible       ${ClearButtonInFilterBar}

Click The Clear Button
    Wait Until Keyword Succeeds         10sec      0.05sec      Click Clear Button

Click The Go Button In The Filter GoButtonInTheFilterDialog
    Click Element                       ${GoButtonInTheFilterDialog}

Hitting Back Button
     Wait Until Element Is Enabled      jquery=#${BackButton}
     Wait Until Keyword Succeeds        10sec     0.05sec      Click The Back Button

Finish Tests
    Wait Until Page Contains Element       css=div.sapUshellShellHeadCenter
    Conclude