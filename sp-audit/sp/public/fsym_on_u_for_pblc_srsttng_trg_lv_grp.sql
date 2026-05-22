CREATE OR REPLACE FUNCTION public.fsym_on_u_for_pblc_srsttng_trg_lv_grp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$                                                                                                                
                                declare var_row_data text; 
                                declare var_old_data text; 
                                begin
                                   
                                  if 1=1 and "sym".sym_triggers_disabled() != 2 then                                                                                                 
                                    var_row_data := 
          case when new."nSettingid" is null then '' else '"' || replace(replace(cast(new."nSettingid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."jNotification" is null then '' else '"' || replace(replace(cast(new."jNotification" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cDef_noti" is null then '' else '"' || replace(replace(cast(new."cDef_noti" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."jShares_noti" is null then '' else '"' || replace(replace(cast(new."jShares_noti" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cPresentation_noti" is null then '' else '"' || replace(replace(cast(new."cPresentation_noti" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cText_noti" is null then '' else '"' || replace(replace(cast(new."cText_noti" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."jNotify_byuser" is null then '' else '"' || replace(replace(cast(new."jNotify_byuser" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."cTwoway_auth" is null then '' else '"' || replace(replace(cast(new."cTwoway_auth" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."dUpdateDt" is null then '' when isfinite(new."dUpdateDt") then '"' || to_char(new."dUpdateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when new."nQuota" is null then '' else '"' || cast(cast(new."nQuota" as numeric) as varchar) || '"' end||','||
          case when new."jMfscolumn" is null then '' else '"' || replace(replace(cast(new."jMfscolumn" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nCaseid" is null then '' else '"' || replace(replace(cast(new."nCaseid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."nUserid" is null then '' else '"' || replace(replace(cast(new."nUserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when new."ZnCaseid" is null then '' else '"' || cast(cast(new."ZnCaseid" as numeric) as varchar) || '"' end||','||
          case when new."ZnSettingid" is null then '' else '"' || cast(cast(new."ZnSettingid" as numeric) as varchar) || '"' end||','||
          case when new."ZnUserid" is null then '' else '"' || cast(cast(new."ZnUserid" as numeric) as varchar) || '"' end; 
                                    var_old_data := 
          case when old."nSettingid" is null then '' else '"' || replace(replace(cast(old."nSettingid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."jNotification" is null then '' else '"' || replace(replace(cast(old."jNotification" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cDef_noti" is null then '' else '"' || replace(replace(cast(old."cDef_noti" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."jShares_noti" is null then '' else '"' || replace(replace(cast(old."jShares_noti" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cPresentation_noti" is null then '' else '"' || replace(replace(cast(old."cPresentation_noti" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cText_noti" is null then '' else '"' || replace(replace(cast(old."cText_noti" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."jNotify_byuser" is null then '' else '"' || replace(replace(cast(old."jNotify_byuser" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."cTwoway_auth" is null then '' else '"' || replace(replace(cast(old."cTwoway_auth" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."dUpdateDt" is null then '' when isfinite(old."dUpdateDt") then '"' || to_char(old."dUpdateDt", 'YYYY-MM-DD HH24:MI:SS.US') || '"' else '' end||','||
          case when old."nQuota" is null then '' else '"' || cast(cast(old."nQuota" as numeric) as varchar) || '"' end||','||
          case when old."jMfscolumn" is null then '' else '"' || replace(replace(cast(old."jMfscolumn" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nCaseid" is null then '' else '"' || replace(replace(cast(old."nCaseid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."nUserid" is null then '' else '"' || replace(replace(cast(old."nUserid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end||','||
          case when old."ZnCaseid" is null then '' else '"' || cast(cast(old."ZnCaseid" as numeric) as varchar) || '"' end||','||
          case when old."ZnSettingid" is null then '' else '"' || cast(cast(old."ZnSettingid" as numeric) as varchar) || '"' end||','||
          case when old."ZnUserid" is null then '' else '"' || cast(cast(old."ZnUserid" as numeric) as varchar) || '"' end; 
                                    if 1=1 then 
                                    insert into "sym".sym_data                                                                                                                     
                                    (table_name, event_type, trigger_hist_id, pk_data, row_data, old_data, channel_id, transaction_id, source_node_id, external_data, create_time)                     
                                    values(                                                                                                                                                            
                                      'UserSetting',                                                                                                                                            
                                      'U',                                                                                                                                                             
                                      285,                                                                                                                                             
                                      
          case when old."nSettingid" is null then '' else '"' || replace(replace(cast(old."nSettingid" as varchar),$$\$$,$$\\$$),'"',$$\"$$) || '"' end,                                                                                                                                                      
                                      var_row_data,                                                                                                                                                      
                                      var_old_data,                                                                                                                                                   
                                      'public_usersetting',                                                                                                                                                
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
