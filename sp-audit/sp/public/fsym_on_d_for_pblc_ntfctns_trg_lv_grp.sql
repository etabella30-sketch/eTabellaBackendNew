CREATE OR REPLACE FUNCTION public.fsym_on_d_for_pblc_ntfctns_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                begin                                                                                                                                                                  
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                               
                                    values(                                                                                                                                                            
                                      'Notifications',                                                                                                                                            
                                      'D',                                                                                                                                                             
                                      264,                                                                                                                                             
                                      
          case when old."nNTid" is null then '' else '"' || replace(replace(cast(old."nNTid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      
          case when old."nNTid" is null then '' else '"' || replace(replace(cast(old."nNTid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cTitle" is null then '' else '"' || replace(replace(cast(old."cTitle" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cMsg" is null then '' else '"' || replace(replace(cast(old."cMsg" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."dDate" is null then '' when isfinite(old."dDate") then '"' || to_char(old."dDate", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."cStatus" is null then '' else '"' || replace(replace(cast(old."cStatus" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."isScheduled" is null then '' when old."isScheduled" then '"1"' else '"0"' end||','||
          case when old."cType" is null then '' else '"' || replace(replace(cast(old."cType" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."bIsseen" is null then '' when old."bIsseen" then '"1"' else '"0"' end||','||
          case when old."nPresentid" is null then '' else '"' || replace(replace(cast(old."nPresentid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nBundledetailid" is null then '' else '"' || replace(replace(cast(old."nBundledetailid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nCaseid" is null then '' else '"' || replace(replace(cast(old."nCaseid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nDocid" is null then '' else '"' || replace(replace(cast(old."nDocid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nFSid" is null then '' else '"' || replace(replace(cast(old."nFSid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nUPid" is null then '' else '"' || replace(replace(cast(old."nUPid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nUserid" is null then '' else '"' || replace(replace(cast(old."nUserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nRefuserid" is null then '' else '"' || replace(replace(cast(old."nRefuserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nWebid" is null then '' else '"' || replace(replace(cast(old."nWebid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnBundledetailid" is null then '' else '"' || cast(cast(old."ZnBundledetailid" as numeric) as varchar) || '"' end||','||
          case when old."ZnCaseid" is null then '' else '"' || cast(cast(old."ZnCaseid" as numeric) as varchar) || '"' end||','||
          case when old."ZnDocid" is null then '' else '"' || cast(cast(old."ZnDocid" as numeric) as varchar) || '"' end||','||
          case when old."ZnFSid" is null then '' else '"' || cast(cast(old."ZnFSid" as numeric) as varchar) || '"' end||','||
          case when old."ZnNTid" is null then '' else '"' || cast(cast(old."ZnNTid" as numeric) as varchar) || '"' end||','||
          case when old."ZnPresentid" is null then '' else '"' || cast(cast(old."ZnPresentid" as numeric) as varchar) || '"' end||','||
          case when old."ZnRefuserid" is null then '' else '"' || cast(cast(old."ZnRefuserid" as numeric) as varchar) || '"' end||','||
          case when old."ZnUPid" is null then '' else '"' || cast(cast(old."ZnUPid" as numeric) as varchar) || '"' end||','||
          case when old."ZnUserid" is null then '' else '"' || cast(cast(old."ZnUserid" as numeric) as varchar) || '"' end||','||
          case when old."ZnWebid" is null then '' else '"' || cast(cast(old."ZnWebid" as numeric) as varchar) || '"' end,                                                                                                                                                   
                                      'public_notifications',                                                                                                                                                
                                      txid_current(),                                                                                                                                               
                                      "sym".sym_node_disabled(),                                                                                                                   
                                      null,                                                                                                                                               
                                      CURRENT_TIMESTAMP                                                                                                                
                                    );                                                                                                                                                                 
                                  end if;                                                                                                                                                              
                                                                                                                                                                               
                                  return null;                                                                                                                                                         
                                end;                                                                                                                                                                   
                                $function$
