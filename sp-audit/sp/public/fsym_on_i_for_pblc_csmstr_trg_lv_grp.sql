CREATE OR REPLACE FUNCTION public.fsym_on_i_for_pblc_csmstr_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, row_data, channel_id, transaction_id, source_node_id, external_data, create_time)                                        
                                    values(                                                                                                                                                            
                                      'CaseMaster',                                                                                                                                            
                                      'I',                                                                                                                                                             
                                      218,                                                                                                                                             
                                      
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
          case when new."cDSize" is null then '' else '"' || replace(replace(cast(new."cDSize" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      'public_casemaster',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
