CREATE OR REPLACE FUNCTION public.fsym_on_u_for_pblc_csmstr_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                declare var_row_data text; 
                                declare var_old_data text; 
                                begin
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    var_row_data := 
          case when new."nCaseid" is null then '' else '"' || replace(replace(cast(new."nCaseid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cCasename" is null then '' else '"' || replace(replace(cast(new."cCasename" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cCaseno" is null then '' else '"' || replace(replace(cast(new."cCaseno" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cClaimant" is null then '' else '"' || replace(replace(cast(new."cClaimant" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cRespondent" is null then '' else '"' || replace(replace(cast(new."cRespondent" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cIndexheader" is null then '' else '"' || replace(replace(cast(new."cIndexheader" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cDesc" is null then '' else '"' || replace(replace(cast(new."cDesc" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."dCreateDt" is null then '' when isfinite(new."dCreateDt") then '"' || to_char(new."dCreateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."dUpdateDt" is null then '' when isfinite(new."dUpdateDt") then '"' || to_char(new."dUpdateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."isArchived" is null then '' when new."isArchived" then '"1"' else '"0"' end||','||
          case when new."nOCaseid" is null then '' else '"' || cast(cast(new."nOCaseid" as numeric) as varchar) || '"' end||','||
          case when new."cTClaimant" is null then '' else '"' || replace(replace(cast(new."cTClaimant" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cTRespondent" is null then '' else '"' || replace(replace(cast(new."cTRespondent" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."isMain" is null then '' when new."isMain" then '"1"' else '"0"' end||','||
          case when new."nCreateId" is null then '' else '"' || replace(replace(cast(new."nCreateId" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nUpdateId" is null then '' else '"' || replace(replace(cast(new."nUpdateId" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ZnCaseid" is null then '' else '"' || cast(cast(new."ZnCaseid" as numeric) as varchar) || '"' end||','||
          case when new."ZnCreateId" is null then '' else '"' || cast(cast(new."ZnCreateId" as numeric) as varchar) || '"' end||','||
          case when new."ZnUpdateId" is null then '' else '"' || cast(cast(new."ZnUpdateId" as numeric) as varchar) || '"' end||','||
          case when new."cDSize" is null then '' else '"' || replace(replace(cast(new."cDSize" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end; 
                                    var_old_data := 
          case when old."nCaseid" is null then '' else '"' || replace(replace(cast(old."nCaseid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cCasename" is null then '' else '"' || replace(replace(cast(old."cCasename" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cCaseno" is null then '' else '"' || replace(replace(cast(old."cCaseno" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cClaimant" is null then '' else '"' || replace(replace(cast(old."cClaimant" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cRespondent" is null then '' else '"' || replace(replace(cast(old."cRespondent" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cIndexheader" is null then '' else '"' || replace(replace(cast(old."cIndexheader" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cDesc" is null then '' else '"' || replace(replace(cast(old."cDesc" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."dCreateDt" is null then '' when isfinite(old."dCreateDt") then '"' || to_char(old."dCreateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."dUpdateDt" is null then '' when isfinite(old."dUpdateDt") then '"' || to_char(old."dUpdateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."isArchived" is null then '' when old."isArchived" then '"1"' else '"0"' end||','||
          case when old."nOCaseid" is null then '' else '"' || cast(cast(old."nOCaseid" as numeric) as varchar) || '"' end||','||
          case when old."cTClaimant" is null then '' else '"' || replace(replace(cast(old."cTClaimant" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cTRespondent" is null then '' else '"' || replace(replace(cast(old."cTRespondent" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."isMain" is null then '' when old."isMain" then '"1"' else '"0"' end||','||
          case when old."nCreateId" is null then '' else '"' || replace(replace(cast(old."nCreateId" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nUpdateId" is null then '' else '"' || replace(replace(cast(old."nUpdateId" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnCaseid" is null then '' else '"' || cast(cast(old."ZnCaseid" as numeric) as varchar) || '"' end||','||
          case when old."ZnCreateId" is null then '' else '"' || cast(cast(old."ZnCreateId" as numeric) as varchar) || '"' end||','||
          case when old."ZnUpdateId" is null then '' else '"' || cast(cast(old."ZnUpdateId" as numeric) as varchar) || '"' end||','||
          case when old."cDSize" is null then '' else '"' || replace(replace(cast(old."cDSize" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end; 
                                    if 1=1 then 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, row_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                     
                                    values(                                                                                                                                                            
                                      'CaseMaster',                                                                                                                                            
                                      'U',                                                                                                                                                             
                                      218,                                                                                                                                             
                                      
          case when old."nCaseid" is null then '' else '"' || replace(replace(cast(old."nCaseid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      var_row_data,                                                                                                                                                      
                                      var_old_data,                                                                                                                                                   
                                      'public_casemaster',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
