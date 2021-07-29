*** Settings ***
Documentation     Navigates to the work order tile return $('label:contains(' + 10020 + ')').parent().parent().children('td.sapMListTblSelCol').children('div.sapMLIBSelectM') Conclude Close Browser
Resource          ../../test-global/resource.robot

*** Variables ***
${TileText}                     Create Purchase Requisition
${AppTitle}                     Purchase Requisitions

${TIMEOUT}          15sec
${RETRY_RATE}       0.05sec
${AddMaterialButton}            $('button[id*=dep-fiori-purchasereq-create--materialAddButton]')[0]
${visibleDateDiv}    $('div.sapUiCal.sapUiShd[style*=visible]')
${DialogErrorMessageButton}     button[id*=messages-button]
${CloseErrorMessageButton}     button[title=Close]


*** Keywords ***
Go Back
    ${temp}=    Execute Javascript    return $('a[id*=backBtn]')[0];
    Click Element    ${temp}

Click Material Add Button
    ${temp}=    Execute Javascript    return $('button[id*=dep-fiori-purchasereq-create--materialAddButton]')[0];
    Click Element    ${temp}

Search Material
    [Arguments]    ${matnr}
    ${temp0}=    Execute Javascript    return $('input[id*=searchInput-I]')[0];
    Input Text    ${temp0}    ${matnr}
    ${temp1}=    Execute Javascript    return $('div[id*=searchInput-search]')[0]
    Click Element    ${temp1}

Select Material
    [Arguments]    ${matnr}
    ${selectMaterial}=    Execute Javascript    return $('label:contains(' + ${matnr} + ')').parent().parent().parent().parent().find('div.sapMLIBSelectM')[0];
    Click Element    ${selectMaterial}

Input Qty
    [Arguments]    ${matnr}    ${qty}
    ${temp}=    Execute Javascript    return $('label:contains(' + ${matnr} + ')').parent().parent().parent().parent().find('input.sapMInputBaseInner[type=number]')[0];
    Input Text    ${temp}    ${qty}

Click Ok Button
    ${temp}=    Execute Javascript    return $('button:contains(OK)')[0];
    Click Element    ${temp}

Click Save Button
    ${temp}=    Execute Javascript    return $('button:contains(Save)')[0];
    Click Element    ${temp}

Click Cancel Button
    ${temp}=    Execute Javascript    return $('button[id*=cancel-button]')[0];
    Click Element    ${temp}

Click Error Message Button
    Click Element    jquery=${DialogErrorMessageButton}

Close Error Message Box
    Click Element    jquery=${CloseErrorMessageButton}

Choose Material(1)
    [Arguments]    ${matnr}
    Wait Until Keyword Succeeds    ${TIMEOUT}    ${RETRY_RATE}    Search Material   ${matnr}
    Wait Until Keyword Succeeds    ${TIMEOUT}    ${RETRY_RATE}    Select Material   ${matnr}
    Wait Until Keyword Succeeds    ${TIMEOUT}    ${RETRY_RATE}    Input Qty   ${matnr}    1
    Wait For    Click Ok Button

Choose Material(2)
    [Arguments]    ${matnr}
    Wait Until Keyword Succeeds    ${TIMEOUT}    ${RETRY_RATE}    Search Material   ${matnr}
    Wait Until Keyword Succeeds    ${TIMEOUT}    ${RETRY_RATE}    Select Material   ${matnr}
    Wait Until Keyword Succeeds    ${TIMEOUT}    ${RETRY_RATE}    Input Qty   ${matnr}    1

Check Error Message
    [Arguments]    ${matnr}
    Wait For    Click Error Message Button
    Wait Until Page Contains Element       jquery=div:contains(Material ${matnr} on an open PR. Cannot be added.)
    Wait For    Close Error Message Box
    Wait Until Keyword Succeeds    ${TIMEOUT}    ${RETRY_RATE}    Select Material   ${matnr}

Check Warning Message
    [Arguments]    ${matnr}
    Wait For    Click Error Message Button
    Wait Until Page Contains Element       jquery=div:contains(Material ${matnr} on an open PR.)
    Wait For    Close Error Message Box

Change Config
    [Arguments]    ${config}
    Change Global Sync Option Config    CreatePRforDupItemApproved    ${config}
    Change Global Sync Option Config    CreatePRforDupItemRejected    ${config}
    Change Global Sync Option Config    CreatePRforDupItemWFApproval    ${config}
    Change Global Sync Option Config    CreatePRforDupItemPending    ${config}

*** Test Cases ***
Start Test
    Open Browser To Start
    Log In

Choose Material With Error
    Click Launchpad Tile And Entering
    Change Config    N
    Wait For    Click Material Add Button
    Choose Material(1)    000817
    Check Error Message    000817
    Choose Material(1)    000814
    Check Error Message    000814
    Choose Material(1)    000815
    Check Error Message    000815
    Choose Material(1)    000816
    Check Error Message    000816
    Wait For    Click Cancel Button

Choose Material Without Error
    Change Config    Y
    Wait For    Click Material Add Button
    Choose Material(2)    000817
    Check Warning Message    000817
    Wait For    Click Ok Button
    Wait For    Click Material Add Button
    Choose Material(2)    000814
    Check Warning Message    000814
    Wait For    Click Ok Button
    Wait For    Click Material Add Button
    Choose Material(2)    000815
    Check Warning Message    000815
    Wait For    Click Ok Button
    Wait For    Click Material Add Button
    Choose Material(2)    000816
    Check Warning Message    000816
    Wait For    Click Ok Button

Save PR
    Wait For    Click Save Button

Conclude
    Close Browser