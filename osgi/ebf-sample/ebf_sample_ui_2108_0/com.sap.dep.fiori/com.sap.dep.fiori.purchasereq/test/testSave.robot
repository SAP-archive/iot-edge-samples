*** Settings ***
Documentation     Navigates to the work order tile return $('label:contains(' + 10020 + ')').parent().parent().children('td.sapMListTblSelCol').children('div.sapMLIBSelectM') Conclude Close Browser
Resource          ../../test-global/resource.robot

*** Variables ***
${TileText}                     Create Purchase Requisition
${AppTitle}                     Purchase Requisitions

${TIMEOUT}          10sec
${RETRY_RATE}       0.05sec
${AddMaterialButton}            span[id*=materialAddButton]
${visibleDateDiv}    $('div.sapUiCal.sapUiShd[style*=visible]')
${PRSaveButton}                 button[id*=purchasereq-create--save-button]
${PRErrorMessageButton}         button[id*=purchasereq-create--messages-button]
${ClosePRErrorMessageButton}    button[title=Close]


*** Keywords ***
Click Material Add Button
    Click Element                       jquery=${AddMaterialButton}

Select Material
    [Arguments]    ${matnr}
    ${selectMaterial}=    Execute Javascript    return $('label:contains(' + ${matnr} + ')').parent().parent().parent().find('div.sapMLIBSelectM')[0];
    Click Element    ${selectMaterial}

Clear Material Quantity In PR
    [Arguments]    ${matnr}
    ${temp}=    Execute Javascript    return $('label:contains(' + ${matnr} + ')').parent().parent().find('input.sapMInputBaseInner')[0];
    Clear Element Text     ${temp}

Input Quantity In PR
    [Arguments]    ${matnr}    ${qty}
    ${temp}=    Execute Javascript    return $('label:contains(' + ${matnr} + ')').parent().parent().find('input.sapMInputBaseInner')[0];
    Input Text    ${temp}    ${qty}

Input Qty
    [Arguments]    ${matnr}    ${qty}
    ${temp}=    Execute Javascript    return $('label:contains(' + ${matnr} + ')').parent().parent().parent().find('input.sapMInputBaseInner[type=number]')[0];
    Input Text    ${temp}    ${qty}

Click Date Button
    [Arguments]    ${matnr}
    ${temp}=    Execute Javascript    return $('label:contains(' + ${matnr} + ')').parent().parent().parent().find('span[id*=picker]')[0];
    Click Element    ${temp}

Pick A TIME In PR
    [Arguments]    ${matnr}    ${time}
    ${temp}=    Execute Javascript    return $('label:contains(' + ${matnr} + ')').parent().parent().parent().find('input.sapMInputBaseInner')[1];
    Input Text    ${temp}     ${time}

Click Ok Button
    ${temp}=    Execute Javascript    return $('button[id*=save-button]')[0];
    Click Element    ${temp}

Click Error Message Button
    Click Element    jquery=${PRErrorMessageButton}

Close Error Message Box
    Click Element    jquery=${ClosePRErrorMessageButton}

Add Material
    [Arguments]    ${matnr}    ${qty}    ${year}    ${month}   ${day}
    Wait For    Click Material Add Button
    Wait Until Keyword Succeeds    ${TIMEOUT}    ${RETRY_RATE}    Select Material   ${matnr}
    Wait Until Keyword Succeeds    ${TIMEOUT}    ${RETRY_RATE}    Input Qty   ${matnr}    ${qty}
    Wait Until Keyword Succeeds    ${TIMEOUT}    ${RETRY_RATE}    Click Date Button   ${matnr}
    Wait Until Keyword Succeeds    ${TIMEOUT}    ${RETRY_RATE}    Pick Date    ${year}    ${month}   ${day}
    Wait For    Click Ok Button



*** Test Cases ***
Start Test
    Open Browser To Start
    Log In

Navigate to App
    Click Launchpad Tile And Entering

Add Material
    Add Material        10020    1    2017    'August'    11
    Add Material        10012    1    2017    'August'    11

Add Empty Quantity
    Wait Until Keyword Succeeds    ${TIMEOUT}    ${RETRY_RATE}    Clear Material Quantity In PR    10020
    Wait Until Keyword Succeeds    ${TIMEOUT}    ${RETRY_RATE}    Pick A TIME In PR    10020    Jan 10, 2017

Check Error Massage
    Click Element      jquery=${PRSaveButton}
    Wait For    Click Error Message Button
    Wait Until Page Contains Element       jquery=div:contains(quantity infomation missing)
    Wait For    Close Error Message Box

Give Correct Info And Save
    Wait Until Keyword Succeeds    ${TIMEOUT}    ${RETRY_RATE}    Input Quantity In PR    10020    3
    Wait Until Keyword Succeeds    ${TIMEOUT}    ${RETRY_RATE}    Pick A TIME In PR    10020     Sep 7, 2017

Click Save Button
    Click Element      jquery=${PRSaveButton}
    Wait Until Page Contains Element       jquery=div:contains(saved)

Conclude
    Close Browser


