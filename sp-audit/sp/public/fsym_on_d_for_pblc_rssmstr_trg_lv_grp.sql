CREATE OR REPLACE FUNCTION public.fsym_on_d_for_pblc_rssmstr_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                               
                                    values(                                                                                                                                                            
                                      'RIssueMaster',                                                                                                                                            
                                      'D',                                                                                                                                                             
                                      229,                                                                                                                                             
                                      
          case when old."nIid" is null then '' else '"' || replace(replace(cast(old."nIid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      
          case when old."nIid" is null then '' else '"' || replace(replace(cast(old."nIid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cIName" is null then '' else '"' || replace(replace(cast(old."cIName" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cColor" is null then '' else '"' || replace(replace(cast(old."cColor" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."dCreatedt" is null then '' when isfinite(old."dCreatedt") then '"' || to_char(old."dCreatedt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."dUpdatedt" is null then '' when isfinite(old."dUpdatedt") then '"' || to_char(old."dUpdatedt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."nOIid" is null then '' else '"' || cast(cast(old."nOIid" as numeric) as varchar) || '"' end||','||
          case when old."nTempid" is null then '' else '"' || cast(cast(old."nTempid" as numeric) as varchar) || '"' end||','||
          case when old."nCaseid" is null then '' else '"' || replace(replace(cast(old."nCaseid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nICid" is null then '' else '"' || replace(replace(cast(old."nICid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nUserid" is null then '' else '"' || replace(replace(cast(old."nUserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnCaseid" is null then '' else '"' || cast(cast(old."ZnCaseid" as numeric) as varchar) || '"' end||','||
          case when old."ZnICid" is null then '' else '"' || cast(cast(old."ZnICid" as numeric) as varchar) || '"' end||','||
          case when old."ZnIid" is null then '' else '"' || cast(cast(old."ZnIid" as numeric) as varchar) || '"' end||','||
          case when old."ZnUserid" is null then '' else '"' || cast(cast(old."ZnUserid" as numeric) as varchar) || '"' end,                                                                                                                                                   
                                      'public_rissuemaster',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
