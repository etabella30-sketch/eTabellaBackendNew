# Stored Procedure Audit — etabella_tech_uuid

**Host:** public-vultr-prod-244eaba4-aab7-4423-baec-cee3af09d5b7-vultr-pr.vultrdb.com:16751
**Generated:** 2026-05-03T12:42:26.696Z
**Total SPs scanned:** 1081
**Total findings:** 907

## SPs by schema

| Schema | SPs |
|---|---|
| public | 720 |
| realtime | 92 |
| sym | 89 |
| present | 72 |
| task | 30 |
| helpcenter | 29 |
| download | 18 |
| transcript | 15 |
| elastic | 8 |
| upload | 8 |

## SPs by language

| Language | Count |
|---|---|
| plpgsql | 1038 |
| c | 41 |
| sql | 2 |

## SPs by volatility

| Volatility | Count |
|---|---|
| VOLATILE (default) | 1037 |
| IMMUTABLE | 38 |
| STABLE | 6 |

## Largest SPs (top 20 by line count)

| Lines | SP |
|---|---|
| 541 | `public.et_admin_bundles_filetypes_backup` |
| 541 | `public.et_admin_bundles_filetypes_today_backup` |
| 523 | `public.et_bundledetail_search` |
| 523 | `public.et_bundledetail_search_test` |
| 470 | `public.et_admin_bundles_filetypes` |
| 470 | `public.et_admin_bundles_filetypes_backup1312026` |
| 469 | `public.et_admin_bundles_filetypes_test` |
| 404 | `realtime.et_navigate_get_all` |
| 377 | `public.et_bundledetail_with_filter` |
| 368 | `public.et_bundledetail_backup1` |
| 362 | `realtime.et_navigate_get_all_backup` |
| 350 | `public.et_navigate_get_all` |
| 347 | `public.et_navigate_get_all_test` |
| 347 | `realtime.filter_marknav` |
| 343 | `public.et_admin_searched_bundles` |
| 343 | `public.et_admin_searched_bundles_test` |
| 341 | `realtime.filter_marknav` |
| 331 | `public.et_displayfiles` |
| 288 | `realtime.et_navigate_factlist` |
| 279 | `upload.et_save_bundledetails` |

## Findings summary

| Severity | Issue | SPs affected |
|---|---|---|
| HIGH | EXECUTE_NO_USING | 55 |
| MEDIUM | VOLATILE_BUT_READ_ONLY | 420 |
| MEDIUM | EXCEPTION_WHEN_OTHERS | 31 |
| LOW | SELECT_STAR | 179 |
| LOW | MULTIPLE_SELECT_INTO | 71 |
| LOW | RAISE_NOTICE_DEBUG | 67 |
| LOW | MANY_LEFT_JOINS_NO_DISTINCT | 44 |
| LOW | MANY_REFCURSORS | 19 |
| LOW | VERY_LONG_BODY | 18 |
| LOW | HEAVY_JSON_PARAM_PARSING | 2 |
| LOW | DYNAMIC_SQL | 1 |

## Top 30 SPs by issue count

| Rank | SP | Issues |
|---|---|---|
| 1 | `public.et_log_insert` | EXCEPTION_WHEN_OTHERS, RAISE_NOTICE_DEBUG, VOLATILE_BUT_READ_ONLY, SELECT_STAR, EXECUTE_NO_USING, EXCEPTION_WHEN_OTHERS, RAISE_NOTICE_DEBUG, VOLATILE_BUT_READ_ONLY, DYNAMIC_SQL |
| 2 | `public.et_admin_bundles_filetypes` | EXCEPTION_WHEN_OTHERS, RAISE_NOTICE_DEBUG, VOLATILE_BUT_READ_ONLY, MULTIPLE_SELECT_INTO, SELECT_STAR, EXECUTE_NO_USING, VERY_LONG_BODY |
| 3 | `public.et_admin_bundles_filetypes_backup1312026` | EXCEPTION_WHEN_OTHERS, RAISE_NOTICE_DEBUG, VOLATILE_BUT_READ_ONLY, MULTIPLE_SELECT_INTO, SELECT_STAR, EXECUTE_NO_USING, VERY_LONG_BODY |
| 4 | `public.et_admin_bundles_filetypes_test` | EXCEPTION_WHEN_OTHERS, RAISE_NOTICE_DEBUG, VOLATILE_BUT_READ_ONLY, MULTIPLE_SELECT_INTO, SELECT_STAR, EXECUTE_NO_USING, VERY_LONG_BODY |
| 5 | `public.et_admin_bundles_filetypes_backup` | EXCEPTION_WHEN_OTHERS, VOLATILE_BUT_READ_ONLY, MULTIPLE_SELECT_INTO, SELECT_STAR, EXECUTE_NO_USING, VERY_LONG_BODY |
| 6 | `public.et_admin_bundles_filetypes_today_backup` | EXCEPTION_WHEN_OTHERS, VOLATILE_BUT_READ_ONLY, MULTIPLE_SELECT_INTO, SELECT_STAR, EXECUTE_NO_USING, VERY_LONG_BODY |
| 7 | `public.et_admin_searched_bundles` | EXCEPTION_WHEN_OTHERS, RAISE_NOTICE_DEBUG, VOLATILE_BUT_READ_ONLY, MULTIPLE_SELECT_INTO, EXECUTE_NO_USING, VERY_LONG_BODY |
| 8 | `public.et_admin_searched_bundles_test` | EXCEPTION_WHEN_OTHERS, RAISE_NOTICE_DEBUG, VOLATILE_BUT_READ_ONLY, MULTIPLE_SELECT_INTO, EXECUTE_NO_USING, VERY_LONG_BODY |
| 9 | `public.et_bundledetail_backup1` | EXCEPTION_WHEN_OTHERS, RAISE_NOTICE_DEBUG, VOLATILE_BUT_READ_ONLY, SELECT_STAR, EXECUTE_NO_USING, VERY_LONG_BODY |
| 10 | `public.et_bundledetail_search` | EXCEPTION_WHEN_OTHERS, RAISE_NOTICE_DEBUG, VOLATILE_BUT_READ_ONLY, SELECT_STAR, EXECUTE_NO_USING, VERY_LONG_BODY |
| 11 | `public.et_bundledetail_search_test` | EXCEPTION_WHEN_OTHERS, RAISE_NOTICE_DEBUG, VOLATILE_BUT_READ_ONLY, SELECT_STAR, EXECUTE_NO_USING, VERY_LONG_BODY |
| 12 | `public.et_bundledetail_with_filter` | RAISE_NOTICE_DEBUG, VOLATILE_BUT_READ_ONLY, MULTIPLE_SELECT_INTO, SELECT_STAR, EXECUTE_NO_USING, VERY_LONG_BODY |
| 13 | `realtime.et_navigate_facts_bycompany` | RAISE_NOTICE_DEBUG, VOLATILE_BUT_READ_ONLY, MULTIPLE_SELECT_INTO, SELECT_STAR, EXECUTE_NO_USING, MANY_LEFT_JOINS_NO_DISTINCT |
| 14 | `realtime.et_navigate_get_all` | RAISE_NOTICE_DEBUG, VOLATILE_BUT_READ_ONLY, MULTIPLE_SELECT_INTO, SELECT_STAR, EXECUTE_NO_USING, VERY_LONG_BODY |
| 15 | `public.et_bundledetail` | EXCEPTION_WHEN_OTHERS, RAISE_NOTICE_DEBUG, VOLATILE_BUT_READ_ONLY, SELECT_STAR, EXECUTE_NO_USING |
| 16 | `public.et_bundledetail_test` | EXCEPTION_WHEN_OTHERS, RAISE_NOTICE_DEBUG, VOLATILE_BUT_READ_ONLY, SELECT_STAR, EXECUTE_NO_USING |
| 17 | `public.et_bundledetail_test2` | EXCEPTION_WHEN_OTHERS, RAISE_NOTICE_DEBUG, VOLATILE_BUT_READ_ONLY, SELECT_STAR, EXECUTE_NO_USING |
| 18 | `public.et_get_bundle_links` | RAISE_NOTICE_DEBUG, VOLATILE_BUT_READ_ONLY, MULTIPLE_SELECT_INTO, MANY_LEFT_JOINS_NO_DISTINCT, MANY_REFCURSORS |
| 19 | `public.et_navigate_get_all` | RAISE_NOTICE_DEBUG, VOLATILE_BUT_READ_ONLY, SELECT_STAR, EXECUTE_NO_USING, VERY_LONG_BODY |
| 20 | `public.et_navigate_get_all_test` | RAISE_NOTICE_DEBUG, VOLATILE_BUT_READ_ONLY, SELECT_STAR, EXECUTE_NO_USING, VERY_LONG_BODY |
| 21 | `realtime.et_marknav_doclinks` | RAISE_NOTICE_DEBUG, VOLATILE_BUT_READ_ONLY, MULTIPLE_SELECT_INTO, SELECT_STAR, EXECUTE_NO_USING |
| 22 | `realtime.et_marknav_doclinks_test` | RAISE_NOTICE_DEBUG, VOLATILE_BUT_READ_ONLY, MULTIPLE_SELECT_INTO, SELECT_STAR, EXECUTE_NO_USING |
| 23 | `realtime.et_navigate_get_all_backup` | RAISE_NOTICE_DEBUG, VOLATILE_BUT_READ_ONLY, SELECT_STAR, EXECUTE_NO_USING, VERY_LONG_BODY |
| 24 | `download.et_insert_download_process_new` | RAISE_NOTICE_DEBUG, MULTIPLE_SELECT_INTO, SELECT_STAR, MANY_LEFT_JOINS_NO_DISTINCT |
| 25 | `public.et_batchfile_update` | RAISE_NOTICE_DEBUG, MULTIPLE_SELECT_INTO, SELECT_STAR, EXECUTE_NO_USING |
| 26 | `public.et_export_grid` | RAISE_NOTICE_DEBUG, VOLATILE_BUT_READ_ONLY, SELECT_STAR, EXECUTE_NO_USING |
| 27 | `public.et_realtime_export_annotations_summary` | RAISE_NOTICE_DEBUG, VOLATILE_BUT_READ_ONLY, SELECT_STAR, MANY_LEFT_JOINS_NO_DISTINCT |
| 28 | `public.et_realtime_export_annotations_summary_test` | RAISE_NOTICE_DEBUG, VOLATILE_BUT_READ_ONLY, SELECT_STAR, MANY_LEFT_JOINS_NO_DISTINCT |
| 29 | `public.et_sidenav_filecontacts_list` | RAISE_NOTICE_DEBUG, VOLATILE_BUT_READ_ONLY, EXECUTE_NO_USING, MANY_LEFT_JOINS_NO_DISTINCT |
| 30 | `public.et_sidenave_tasks_facttaskissues` | RAISE_NOTICE_DEBUG, VOLATILE_BUT_READ_ONLY, EXECUTE_NO_USING, MANY_LEFT_JOINS_NO_DISTINCT |

## Findings by issue type

### HIGH — EXECUTE_NO_USING (55 SPs)

Dynamic SQL built without parameter binding. **High SQL injection risk** if any input flows into the EXECUTE string. Audit each one.

<details><summary>Affected SPs (55)</summary>

- `present.et_present_setup_files` — 1 EXECUTE without USING — possible SQL injection
- `public.dynamic_pivot` — 1 EXECUTE without USING — possible SQL injection
- `public.et_admin_bundles_filetypes` — 1 EXECUTE without USING — possible SQL injection
- `public.et_admin_bundles_filetypes_backup` — 1 EXECUTE without USING — possible SQL injection
- `public.et_admin_bundles_filetypes_backup1312026` — 1 EXECUTE without USING — possible SQL injection
- `public.et_admin_bundles_filetypes_test` — 1 EXECUTE without USING — possible SQL injection
- `public.et_admin_bundles_filetypes_today_backup` — 1 EXECUTE without USING — possible SQL injection
- `public.et_admin_searched_bundles` — 1 EXECUTE without USING — possible SQL injection
- `public.et_admin_searched_bundles_test` — 1 EXECUTE without USING — possible SQL injection
- `public.et_batchfile_update` — 3 EXECUTE without USING — possible SQL injection
- `public.et_bundledetail` — 1 EXECUTE without USING — possible SQL injection
- `public.et_bundledetail_backup1` — 1 EXECUTE without USING — possible SQL injection
- `public.et_bundledetail_old` — 1 EXECUTE without USING — possible SQL injection
- `public.et_bundledetail_search` — 1 EXECUTE without USING — possible SQL injection
- `public.et_bundledetail_search_test` — 1 EXECUTE without USING — possible SQL injection
- `public.et_bundledetail_test` — 1 EXECUTE without USING — possible SQL injection
- `public.et_bundledetail_test2` — 1 EXECUTE without USING — possible SQL injection
- `public.et_bundledetail_with_filter` — 3 EXECUTE without USING — possible SQL injection
- `public.et_export_grid` — 1 EXECUTE without USING — possible SQL injection
- `public.et_export_grid_test` — 1 EXECUTE without USING — possible SQL injection
- `public.et_log_insert` — 1 EXECUTE without USING — possible SQL injection
- `public.et_navigate_doclist` — 1 EXECUTE without USING — possible SQL injection
- `public.et_navigate_factlinks` — 1 EXECUTE without USING — possible SQL injection
- `public.et_navigate_factlist` — 1 EXECUTE without USING — possible SQL injection
- `public.et_navigate_facts_bycompany` — 1 EXECUTE without USING — possible SQL injection
- `public.et_navigate_get_all` — 4 EXECUTE without USING — possible SQL injection
- `public.et_navigate_get_all_links` — 2 EXECUTE without USING — possible SQL injection
- `public.et_navigate_get_all_test` — 4 EXECUTE without USING — possible SQL injection
- `public.et_navigate_weblinks` — 1 EXECUTE without USING — possible SQL injection
- `public.et_sidenav_filecontacts_list` — 1 EXECUTE without USING — possible SQL injection
- `public.et_sidenave_tasks_facttaskissues` — 1 EXECUTE without USING — possible SQL injection
- `public.et_sidenave_tasks_filetasks` — 1 EXECUTE without USING — possible SQL injection
- `public.et_workspace_contacts_list` — 1 EXECUTE without USING — possible SQL injection
- `public.et_workspace_fact_files` — 1 EXECUTE without USING — possible SQL injection
- `public.et_workspace_fact_issues` — 1 EXECUTE without USING — possible SQL injection
- `public.et_workspace_fact_issues_backup` — 1 EXECUTE without USING — possible SQL injection
- `public.et_workspace_fact_list` — 1 EXECUTE without USING — possible SQL injection
- `public.et_workspace_fact_list___07_working ` — 1 EXECUTE without USING — possible SQL injection
- `public.et_workspace_fact_list_backup_multiple` — 1 EXECUTE without USING — possible SQL injection
- `public.et_workspace_fact_list_correct_backup` — 1 EXECUTE without USING — possible SQL injection
- `public.et_workspace_issues_list` — 1 EXECUTE without USING — possible SQL injection
- `public.et_workspace_issues_list_test` — 1 EXECUTE without USING — possible SQL injection
- `public.log_bd_change` — 3 EXECUTE without USING — possible SQL injection
- `public.log_bd_change` — 3 EXECUTE without USING — possible SQL injection
- `realtime.et_marknav_doclinks` — 1 EXECUTE without USING — possible SQL injection
- `realtime.et_marknav_doclinks_test` — 1 EXECUTE without USING — possible SQL injection
- `realtime.et_navigate_factlinks` — 1 EXECUTE without USING — possible SQL injection
- `realtime.et_navigate_factlist` — 1 EXECUTE without USING — possible SQL injection
- `realtime.et_navigate_factlist_old` — 1 EXECUTE without USING — possible SQL injection
- `realtime.et_navigate_facts_bycompany` — 1 EXECUTE without USING — possible SQL injection
- `realtime.et_navigate_facts_bycompany_old` — 1 EXECUTE without USING — possible SQL injection
- `realtime.et_navigate_get_all` — 3 EXECUTE without USING — possible SQL injection
- `realtime.et_navigate_get_all_backup` — 2 EXECUTE without USING — possible SQL injection
- `realtime.et_navigate_quick_mark` — 1 EXECUTE without USING — possible SQL injection
- `transcript.et_get_field_data` — 1 EXECUTE without USING — possible SQL injection

</details>

### MEDIUM — VOLATILE_BUT_READ_ONLY (420 SPs)

No INSERT/UPDATE/DELETE in body but defaults to VOLATILE. Mark `STABLE` so the planner can cache results within a query and parallelize.

<details><summary>Affected SPs (420)</summary>

- `download.et_files` — no INSERT/UPDATE/DELETE — should be STABLE
- `download.et_get_approximate_size` — no INSERT/UPDATE/DELETE — should be STABLE
- `download.et_get_download_jobs` — no INSERT/UPDATE/DELETE — should be STABLE
- `download.et_get_download_presigned_url` — no INSERT/UPDATE/DELETE — should be STABLE
- `download.et_get_hyperlink_jobs` — no INSERT/UPDATE/DELETE — should be STABLE
- `download.et_process_detail` — no INSERT/UPDATE/DELETE — should be STABLE
- `elastic.debug_et_advance_search_filter` — no INSERT/UPDATE/DELETE — should be STABLE
- `elastic.et_advance_search` — no INSERT/UPDATE/DELETE — should be STABLE
- `elastic.et_advance_search_filter` — no INSERT/UPDATE/DELETE — should be STABLE
- `elastic.et_bundles` — no INSERT/UPDATE/DELETE — should be STABLE
- `elastic.et_sub_bundles` — no INSERT/UPDATE/DELETE — should be STABLE
- `elastic.old_et_advance_search` — no INSERT/UPDATE/DELETE — should be STABLE
- `elastic.test_et_advance_search_filter` — no INSERT/UPDATE/DELETE — should be STABLE
- `helpcenter.et_help_get_common_topic` — no INSERT/UPDATE/DELETE — should be STABLE
- `helpcenter.et_help_get_faq_list` — no INSERT/UPDATE/DELETE — should be STABLE
- `helpcenter.et_help_get_keywords` — no INSERT/UPDATE/DELETE — should be STABLE
- `helpcenter.et_help_module_detail` — no INSERT/UPDATE/DELETE — should be STABLE
- `helpcenter.et_help_module_list` — no INSERT/UPDATE/DELETE — should be STABLE
- `helpcenter.et_help_sub_module_detail` — no INSERT/UPDATE/DELETE — should be STABLE
- `helpcenter.et_help_sub_module_list` — no INSERT/UPDATE/DELETE — should be STABLE
- `present.et_download_presentreport` — no INSERT/UPDATE/DELETE — should be STABLE
- `present.et_present_case_getinfo` — no INSERT/UPDATE/DELETE — should be STABLE
- `present.et_present_get_setup_details` — no INSERT/UPDATE/DELETE — should be STABLE
- `present.et_present_highlights` — no INSERT/UPDATE/DELETE — should be STABLE
- `present.et_present_highlights_shared` — no INSERT/UPDATE/DELETE — should be STABLE
- `present.et_present_home_detail` — no INSERT/UPDATE/DELETE — should be STABLE
- `present.et_present_index_data` — no INSERT/UPDATE/DELETE — should be STABLE
- `present.et_present_index_data` — no INSERT/UPDATE/DELETE — should be STABLE
- `present.et_present_individual_detail` — no INSERT/UPDATE/DELETE — should be STABLE
- `present.et_present_individual_tabs` — no INSERT/UPDATE/DELETE — should be STABLE
- `present.et_present_list` — no INSERT/UPDATE/DELETE — should be STABLE
- `present.et_present_ongoing` — no INSERT/UPDATE/DELETE — should be STABLE
- `present.et_present_recent_files` — no INSERT/UPDATE/DELETE — should be STABLE
- `present.et_present_recent_files_ids` — no INSERT/UPDATE/DELETE — should be STABLE
- `present.et_present_remark_list` — no INSERT/UPDATE/DELETE — should be STABLE
- `present.et_present_schedule_list` — no INSERT/UPDATE/DELETE — should be STABLE
- `present.et_present_setup_files` — no INSERT/UPDATE/DELETE — should be STABLE
- `present.et_present_shared_link` — no INSERT/UPDATE/DELETE — should be STABLE
- `present.et_present_status` — no INSERT/UPDATE/DELETE — should be STABLE
- `present.et_present_subtypes` — no INSERT/UPDATE/DELETE — should be STABLE
- `present.et_present_teamusers` — no INSERT/UPDATE/DELETE — should be STABLE
- `present.et_present_toolbar_detail` — no INSERT/UPDATE/DELETE — should be STABLE
- `present.et_present_toolbar_users` — no INSERT/UPDATE/DELETE — should be STABLE
- `present.et_present_types` — no INSERT/UPDATE/DELETE — should be STABLE
- `present.et_present_user_list` — no INSERT/UPDATE/DELETE — should be STABLE
- `public.alphanumeric_sort` — no INSERT/UPDATE/DELETE — should be STABLE
- `public.dynamic_pivot` — no INSERT/UPDATE/DELETE — should be STABLE
- `public.et_activity_bundledata` — no INSERT/UPDATE/DELETE — should be STABLE
- `public.et_activity_casels` — no INSERT/UPDATE/DELETE — should be STABLE
- `public.et_activity_connections` — no INSERT/UPDATE/DELETE — should be STABLE
- `public.et_activity_paginate_scandata` — no INSERT/UPDATE/DELETE — should be STABLE
- `public.et_activity_scandata` — no INSERT/UPDATE/DELETE — should be STABLE
- `public.et_activity_session` — no INSERT/UPDATE/DELETE — should be STABLE
- `public.et_activity_userls` — no INSERT/UPDATE/DELETE — should be STABLE
- `public.et_admin_archivecase` — no INSERT/UPDATE/DELETE — should be STABLE
- `public.et_admin_bundles_filetypes` — no INSERT/UPDATE/DELETE — should be STABLE
- `public.et_admin_bundles_filetypes_backup` — no INSERT/UPDATE/DELETE — should be STABLE
- `public.et_admin_bundles_filetypes_backup1312026` — no INSERT/UPDATE/DELETE — should be STABLE
- `public.et_admin_bundles_filetypes_test` — no INSERT/UPDATE/DELETE — should be STABLE
- `public.et_admin_bundles_filetypes_today_backup` — no INSERT/UPDATE/DELETE — should be STABLE
- `public.et_admin_bundles_pagination_data` — no INSERT/UPDATE/DELETE — should be STABLE
- `public.et_admin_case_assignedusers` — no INSERT/UPDATE/DELETE — should be STABLE
- `public.et_admin_case_getdetail` — no INSERT/UPDATE/DELETE — should be STABLE
- `public.et_admin_case_getinfo` — no INSERT/UPDATE/DELETE — should be STABLE
- `public.et_admin_case_tickets` — no INSERT/UPDATE/DELETE — should be STABLE
- `public.et_admin_searched_bundles` — no INSERT/UPDATE/DELETE — should be STABLE
- `public.et_admin_searched_bundles_test` — no INSERT/UPDATE/DELETE — should be STABLE
- `public.et_admin_sections` — no INSERT/UPDATE/DELETE — should be STABLE
- `public.et_admindashboard` — no INSERT/UPDATE/DELETE — should be STABLE
- `public.et_allusers` — no INSERT/UPDATE/DELETE — should be STABLE
- `public.et_archivecase` — no INSERT/UPDATE/DELETE — should be STABLE
- `public.et_assign_checkbundle_exists` — no INSERT/UPDATE/DELETE — should be STABLE
- `public.et_assign_contact_list` — no INSERT/UPDATE/DELETE — should be STABLE
- `public.et_assign_custom_list` — no INSERT/UPDATE/DELETE — should be STABLE
- `public.et_assign_tag_list` — no INSERT/UPDATE/DELETE — should be STABLE
- `public.et_assign_task_list` — no INSERT/UPDATE/DELETE — should be STABLE
- `public.et_batchfile_columns` — no INSERT/UPDATE/DELETE — should be STABLE
- `public.et_batchfile_log_detail` — no INSERT/UPDATE/DELETE — should be STABLE
- `public.et_batchfile_log_detail` — no INSERT/UPDATE/DELETE — should be STABLE
- `public.et_batchfile_log_summery` — no INSERT/UPDATE/DELETE — should be STABLE
- … and 340 more (see findings.csv)

</details>

### MEDIUM — EXCEPTION_WHEN_OTHERS (31 SPs)

Catches every exception class, hides deadlocks, timeouts, OOM, query cancellations behind a generic handler. Replace with specific exception classes (`unique_violation`, `foreign_key_violation`, etc.) and let everything else propagate.

<details><summary>Affected SPs (31)</summary>

- `public.et_admin_bundles_filetypes` — 1 occurrence(s)
- `public.et_admin_bundles_filetypes_backup` — 3 occurrence(s)
- `public.et_admin_bundles_filetypes_backup1312026` — 1 occurrence(s)
- `public.et_admin_bundles_filetypes_test` — 1 occurrence(s)
- `public.et_admin_bundles_filetypes_today_backup` — 3 occurrence(s)
- `public.et_admin_searched_bundles` — 1 occurrence(s)
- `public.et_admin_searched_bundles_test` — 1 occurrence(s)
- `public.et_admin_update_bundledetail` — 1 occurrence(s)
- `public.et_bundledetail` — 1 occurrence(s)
- `public.et_bundledetail_backup1` — 4 occurrence(s)
- `public.et_bundledetail_search` — 2 occurrence(s)
- `public.et_bundledetail_search_test` — 2 occurrence(s)
- `public.et_bundledetail_test` — 1 occurrence(s)
- `public.et_bundledetail_test2` — 1 occurrence(s)
- `public.et_convert_log` — 1 occurrence(s)
- `public.et_log_insert` — 1 occurrence(s)
- `public.et_log_insert` — 1 occurrence(s)
- `public.et_ocr_update` — 1 occurrence(s)
- `public.et_realtime_ensure_unassigned_issue` — 1 occurrence(s)
- `public.sym_largeobject` — 1 occurrence(s)
- `public.sym_node_disabled` — 1 occurrence(s)
- `public.sym_triggers_disabled` — 1 occurrence(s)
- `public.try_convert_to_dates` — 1 occurrence(s)
- `public.try_convert_to_dates_end_only` — 2 occurrence(s)
- `public.try_convert_to_dates_start_only` — 2 occurrence(s)
- `realtime.et_realtime_handle_qfact_claim_secquence` — 1 occurrence(s)
- `realtime.et_realtime_handle_qfact_secquence` — 1 occurrence(s)
- `sym.sym_largeobject` — 1 occurrence(s)
- `sym.sym_node_disabled` — 1 occurrence(s)
- `sym.sym_triggers_disabled` — 1 occurrence(s)
- `transcript.et_get_transcript_detail` — 1 occurrence(s)

</details>

### LOW — SELECT_STAR (179 SPs)

`SELECT *` inside `OPEN ref FOR …` is fragile (column add changes wire format) and often returns columns the frontend never reads.

<details><summary>Affected SPs (179)</summary>

- `download.et_delete` — 1 SELECT *
- `download.et_get_approximate_size` — 2 SELECT *
- `download.et_get_download_jobs` — 1 SELECT *
- `download.et_insert_download_process_files` — 1 SELECT *
- `download.et_insert_download_process_files_backup` — 1 SELECT *
- `download.et_insert_download_process_files_hyperlink` — 1 SELECT *
- `download.et_insert_download_process_new` — 1 SELECT *
- `elastic.et_advance_search` — 1 SELECT *
- `elastic.et_sub_bundles` — 1 SELECT *
- `elastic.old_et_advance_search` — 1 SELECT *
- `helpcenter.et_help_sub_module_detail` — 1 SELECT *
- `present.et_present_individual_detail` — 1 SELECT *
- `present.et_present_insertupdate_users` — 1 SELECT *
- `present.et_present_link_share` — 1 SELECT *
- `present.et_present_manage_documents` — 1 SELECT *
- `present.et_present_manage_status` — 2 SELECT *
- `present.et_present_schedule_delete` — 1 SELECT *
- `present.et_present_toolbar_user_accept_reject` — 2 SELECT *
- `public.et_activity_paginate_scandata` — 1 SELECT *
- `public.et_activity_userlog` — 1 SELECT *
- `public.et_admin_bundles_filetypes` — 2 SELECT *
- `public.et_admin_bundles_filetypes_backup` — 3 SELECT *
- `public.et_admin_bundles_filetypes_backup1312026` — 2 SELECT *
- `public.et_admin_bundles_filetypes_test` — 2 SELECT *
- `public.et_admin_bundles_filetypes_today_backup` — 3 SELECT *
- `public.et_admin_case_delete` — 1 SELECT *
- `public.et_admin_insertupdate_case` — 1 SELECT *
- `public.et_admin_section_builder` — 1 SELECT *
- `public.et_admin_update_bundle_tab` — 1 SELECT *
- `public.et_admin_update_bundle_tag` — 2 SELECT *
- `public.et_assign_bundles` — 2 SELECT *
- `public.et_assign_contact` — 1 SELECT *
- `public.et_assign_tag` — 1 SELECT *
- `public.et_assign_task` — 1 SELECT *
- `public.et_batchfile_getdata` — 1 SELECT *
- `public.et_batchfile_log_detail` — 1 SELECT *
- `public.et_batchfile_update` — 1 SELECT *
- `public.et_bundlebuilder` — 2 SELECT *
- `public.et_bundledetail` — 4 SELECT *
- `public.et_bundledetail_backup1` — 5 SELECT *
- `public.et_bundledetail_search` — 3 SELECT *
- `public.et_bundledetail_search_test` — 3 SELECT *
- `public.et_bundledetail_test` — 4 SELECT *
- `public.et_bundledetail_test2` — 4 SELECT *
- `public.et_bundledetail_with_filter` — 6 SELECT *
- `public.et_bundles` — 1 SELECT *
- `public.et_copy_bundles` — 1 SELECT *
- `public.et_delete_bundles` — 1 SELECT *
- `public.et_doc_delete` — 2 SELECT *
- `public.et_download_getdata` — 1 SELECT *
- `public.et_download_getdata_backup_210725` — 1 SELECT *
- `public.et_download_index_data` — 1 SELECT *
- `public.et_download_with_linkfiles` — 1 SELECT *
- `public.et_download_with_linkfiles_backup_210725` — 1 SELECT *
- `public.et_export_files_test` — 2 SELECT *
- `public.et_export_grid` — 1 SELECT *
- `public.et_export_grid_test` — 1 SELECT *
- `public.et_export_update_progress` — 1 SELECT *
- `public.et_export_update_progress_1` — 1 SELECT *
- `public.et_export_update_status` — 1 SELECT *
- `public.et_fact_delete` — 1 SELECT *
- `public.et_fact_insert` — 1 SELECT *
- `public.et_fact_insert_issues` — 1 SELECT *
- `public.et_fact_permissions` — 1 SELECT *
- `public.et_fact_task_delete` — 1 SELECT *
- `public.et_fact_update` — 2 SELECT *
- `public.et_get_filedata` — 1 SELECT *
- `public.et_getfact_annotation` — 1 SELECT *
- `public.et_hyperlink_update_documents` — 2 SELECT *
- `public.et_hyperlink_update_documents_index` — 3 SELECT *
- `public.et_index_fileupdate` — 1 SELECT *
- `public.et_individual_annotations_global` — 1 SELECT *
- `public.et_insert_recent_file` — 1 SELECT *
- `public.et_log_insert` — 1 SELECT *
- `public.et_navigate_checkdata` — 9 SELECT *
- `public.et_navigate_doclist` — 1 SELECT *
- `public.et_navigate_fact_companies` — 1 SELECT *
- `public.et_navigate_facts_bycompany` — 1 SELECT *
- `public.et_navigate_get_all` — 1 SELECT *
- `public.et_navigate_get_all_links` — 1 SELECT *
- … and 99 more (see findings.csv)

</details>

### LOW — MULTIPLE_SELECT_INTO (71 SPs)

3+ sequential `SELECT … INTO` scalars are usually consolidatable into one CTE. Each is a separate plan + round-trip.

<details><summary>Affected SPs (71)</summary>

- `download.et_insert_download_process` — 3 SELECT INTO statements
- `download.et_insert_download_process_files` — 3 SELECT INTO statements
- `download.et_insert_download_process_new` — 3 SELECT INTO statements
- `present.et_present_insert_files` — 3 SELECT INTO statements
- `public.dynamic_pivot` — 4 SELECT INTO statements
- `public.et_activity_paginate_scan` — 3 SELECT INTO statements
- `public.et_activity_scandata` — 6 SELECT INTO statements
- `public.et_admin_bundles_filetypes` — 3 SELECT INTO statements
- `public.et_admin_bundles_filetypes_backup` — 3 SELECT INTO statements
- `public.et_admin_bundles_filetypes_backup1312026` — 3 SELECT INTO statements
- `public.et_admin_bundles_filetypes_test` — 3 SELECT INTO statements
- `public.et_admin_bundles_filetypes_today_backup` — 3 SELECT INTO statements
- `public.et_admin_insertupdate_case` — 5 SELECT INTO statements
- `public.et_admin_searched_bundles` — 4 SELECT INTO statements
- `public.et_admin_searched_bundles_test` — 4 SELECT INTO statements
- `public.et_assign_bundles` — 4 SELECT INTO statements
- `public.et_batchfile_update` — 4 SELECT INTO statements
- `public.et_bundle_links` — 4 SELECT INTO statements
- `public.et_bundledetail_with_filter` — 4 SELECT INTO statements
- `public.et_contactbuilder` — 3 SELECT INTO statements
- `public.et_copy_bundles` — 9 SELECT INTO statements
- `public.et_delete_bundles` — 3 SELECT INTO statements
- `public.et_doc_insert` — 5 SELECT INTO statements
- `public.et_excel_bundle_batch` — 3 SELECT INTO statements
- `public.et_export_fact_detail` — 3 SELECT INTO statements
- `public.et_fact_update` — 8 SELECT INTO statements
- `public.et_get_bundle_links` — 3 SELECT INTO statements
- `public.et_hyperlink_update_documents` — 3 SELECT INTO statements
- `public.et_pagination_generate_prefix` — 6 SELECT INTO statements
- `public.et_pagination_generatedata` — 8 SELECT INTO statements
- `public.et_pagination_update_progress` — 4 SELECT INTO statements
- `public.et_pm_reset_permission` — 3 SELECT INTO statements
- `public.et_preview_document_list` — 6 SELECT INTO statements
- `public.et_preview_document_list_1` — 8 SELECT INTO statements
- `public.et_preview_document_list_2` — 8 SELECT INTO statements
- `public.et_realtime_handle_issue_detail` — 3 SELECT INTO statements
- `public.et_realtime_handle_rhighlights` — 4 SELECT INTO statements
- `public.et_realtime_insertupdate_session` — 4 SELECT INTO statements
- `public.et_realtime_sessiondata` — 7 SELECT INTO statements
- `public.et_realtime_sync_highlight_update` — 5 SELECT INTO statements
- `public.et_realtime_sync_issuedetail_update` — 5 SELECT INTO statements
- `public.et_realtime_sync_issueupdate` — 6 SELECT INTO statements
- `public.et_realtime_sync_sessiondetail` — 3 SELECT INTO statements
- `public.et_realtime_sync_sessions` — 4 SELECT INTO statements
- `public.et_share_links` — 6 SELECT INTO statements
- `public.et_share_sectionbundle` — 5 SELECT INTO statements
- `public.et_update_bundles_permisssoins` — 3 SELECT INTO statements
- `public.et_upload_unzip_extractation` — 3 SELECT INTO statements
- `public.et_upload_update_convertinfo` — 4 SELECT INTO statements
- `public.et_user_sectionbuilder` — 3 SELECT INTO statements
- `public.et_web_insert` — 3 SELECT INTO statements
- `realtime.et_annottransfer_insert_ref_quickmark` — 3 SELECT INTO statements
- `realtime.et_doc_insert` — 4 SELECT INTO statements
- `realtime.et_factsheet_submit` — 4 SELECT INTO statements
- `realtime.et_marknav_doclinks` — 3 SELECT INTO statements
- `realtime.et_marknav_doclinks_test` — 3 SELECT INTO statements
- `realtime.et_navigate_fact_companies` — 3 SELECT INTO statements
- `realtime.et_navigate_factlist` — 3 SELECT INTO statements
- `realtime.et_navigate_facts_bycompany` — 4 SELECT INTO statements
- `realtime.et_navigate_get_all` — 4 SELECT INTO statements
- `realtime.et_realtime_sessiondata` — 5 SELECT INTO statements
- `realtime.et_sessiondata` — 5 SELECT INTO statements
- `task.et_convert_insert_tasks` — 4 SELECT INTO statements
- `task.et_hyperlink_insert_tasks` — 3 SELECT INTO statements
- `task.et_ocr_insert_tasks` — 4 SELECT INTO statements
- `task.et_optimize_insert_tasks` — 4 SELECT INTO statements
- `task.et_pagination_insert_tasks` — 4 SELECT INTO statements
- `task.et_pagination_insert_tasks_backup` — 3 SELECT INTO statements
- `task.et_pagination_insert_tasks_non_paginated` — 4 SELECT INTO statements
- `task.et_test_tasks` — 3 SELECT INTO statements
- `upload.et_save_bundledetails` — 14 SELECT INTO statements

</details>

### LOW — RAISE_NOTICE_DEBUG (67 SPs)

NOTICE statements left in shipping code. Each one round-trips a message to the client and dominates log volume in tight loops.

<details><summary>Affected SPs (67)</summary>

- `download.et_insert_download_process_new` — 2 statement(s)
- `elastic.debug_et_advance_search_filter` — 3 statement(s)
- `helpcenter.et_help_get_keywords` — 1 statement(s)
- `present.et_present_setup_files` — 1 statement(s)
- `public.et_activity_userlog` — 1 statement(s)
- `public.et_activity_userls` — 1 statement(s)
- `public.et_admin_bundles_filetypes` — 3 statement(s)
- `public.et_admin_bundles_filetypes_backup1312026` — 3 statement(s)
- `public.et_admin_bundles_filetypes_test` — 3 statement(s)
- `public.et_admin_searched_bundles` — 3 statement(s)
- `public.et_admin_searched_bundles_test` — 3 statement(s)
- `public.et_admin_update_bundledetail` — 1 statement(s)
- `public.et_assign_bundles` — 1 statement(s)
- `public.et_batchfile_update` — 2 statement(s)
- `public.et_bundle_links` — 2 statement(s)
- `public.et_bundledetail` — 3 statement(s)
- `public.et_bundledetail_backup1` — 1 statement(s)
- `public.et_bundledetail_search` — 4 statement(s)
- `public.et_bundledetail_search_test` — 4 statement(s)
- `public.et_bundledetail_test` — 3 statement(s)
- `public.et_bundledetail_test2` — 3 statement(s)
- `public.et_bundledetail_with_filter` — 4 statement(s)
- `public.et_convert_log` — 4 statement(s)
- `public.et_download_selected_files` — 1 statement(s)
- `public.et_export_grid` — 1 statement(s)
- `public.et_export_update_progress` — 1 statement(s)
- `public.et_export_update_progress_1` — 1 statement(s)
- `public.et_get_bundle_links` — 1 statement(s)
- `public.et_get_file_metadata` — 1 statement(s)
- `public.et_log_insert` — 8 statement(s)
- `public.et_log_insert` — 1 statement(s)
- `public.et_navigate_factlinks` — 1 statement(s)
- `public.et_navigate_get_all` — 3 statement(s)
- `public.et_navigate_get_all_test` — 3 statement(s)
- `public.et_ocr_update` — 4 statement(s)
- `public.et_pagination_generate_prefix` — 2 statement(s)
- `public.et_pagination_generatedata` — 5 statement(s)
- `public.et_pagination_nonpaginate_filedata` — 1 statement(s)
- `public.et_realtime_export_annotations_summary` — 1 statement(s)
- `public.et_realtime_export_annotations_summary_test` — 1 statement(s)
- `public.et_realtime_issuelist_group` — 1 statement(s)
- `public.et_realtime_issuelist_group_backup` — 1 statement(s)
- `public.et_share_sectionbundle` — 1 statement(s)
- `public.et_sidenav_filecontacts_list` — 1 statement(s)
- `public.et_sidenave_tasks_facttaskissues` — 1 statement(s)
- `public.et_sidenave_tasks_filetasks` — 1 statement(s)
- `public.et_task_insert_reminder_v2` — 1 statement(s)
- `public.et_upload_update_convertinfo` — 2 statement(s)
- `public.et_user_team_management` — 1 statement(s)
- `public.et_workspace_contacts_list` — 1 statement(s)
- `public.et_workspace_fact_files` — 2 statement(s)
- `public.filter_columnnames` — 1 statement(s)
- `public.filter_whereclause_2` — 2 statement(s)
- `public.filter_whereclause_3` — 2 statement(s)
- `public.migrations_insertbundle` — 3 statement(s)
- `public.try_convert_to_dates` — 4 statement(s)
- `realtime.et_marknav_doclinks` — 2 statement(s)
- `realtime.et_marknav_doclinks_test` — 2 statement(s)
- `realtime.et_navigate_fact_companies` — 1 statement(s)
- `realtime.et_navigate_factlinks` — 1 statement(s)
- `realtime.et_navigate_facts_bycompany` — 3 statement(s)
- `realtime.et_navigate_facts_bycompany_old` — 2 statement(s)
- `realtime.et_navigate_get_all` — 4 statement(s)
- `realtime.et_navigate_get_all_backup` — 2 statement(s)
- `realtime.et_navigate_quick_mark` — 1 statement(s)
- `transcript.et_get_transcript_detail` — 2 statement(s)
- `upload.et_save_bundle` — 2 statement(s)

</details>

### LOW — MANY_LEFT_JOINS_NO_DISTINCT (44 SPs)

Multiple LEFT JOINs feeding a refcursor with no DISTINCT. This is the `et_marks` bug class (April 15 fix) — verify with row-count tests.

<details><summary>Affected SPs (44)</summary>

- `download.et_insert_download_process` — 5 LEFT JOIN(s), no DISTINCT — verify no row duplication
- `download.et_insert_download_process_files_backup` — 4 LEFT JOIN(s), no DISTINCT — verify no row duplication
- `download.et_insert_download_process_new` — 4 LEFT JOIN(s), no DISTINCT — verify no row duplication
- `public.et_admin_case_teamsetup` — 4 LEFT JOIN(s), no DISTINCT — verify no row duplication
- `public.et_bundle_is_issuetag` — 4 LEFT JOIN(s), no DISTINCT — verify no row duplication
- `public.et_contact_detail` — 5 LEFT JOIN(s), no DISTINCT — verify no row duplication
- `public.et_download_getdata` — 4 LEFT JOIN(s), no DISTINCT — verify no row duplication
- `public.et_download_getdata_backup_210725` — 4 LEFT JOIN(s), no DISTINCT — verify no row duplication
- `public.et_download_index_data` — 8 LEFT JOIN(s), no DISTINCT — verify no row duplication
- `public.et_export_fact_detail` — 6 LEFT JOIN(s), no DISTINCT — verify no row duplication
- `public.et_fact_get_detail` — 8 LEFT JOIN(s), no DISTINCT — verify no row duplication
- `public.et_fact_get_issue_links` — 4 LEFT JOIN(s), no DISTINCT — verify no row duplication
- `public.et_get_bundle_links` — 20 LEFT JOIN(s), no DISTINCT — verify no row duplication
- `public.et_individual_annotations_global` — 6 LEFT JOIN(s), no DISTINCT — verify no row duplication
- `public.et_individual_doc_info` — 4 LEFT JOIN(s), no DISTINCT — verify no row duplication
- `public.et_navigate_checkdata` — 17 LEFT JOIN(s), no DISTINCT — verify no row duplication
- `public.et_navigate_task_facts` — 4 LEFT JOIN(s), no DISTINCT — verify no row duplication
- `public.et_notification_list` — 7 LEFT JOIN(s), no DISTINCT — verify no row duplication
- `public.et_preview_document_list` — 5 LEFT JOIN(s), no DISTINCT — verify no row duplication
- `public.et_preview_document_list_1` — 13 LEFT JOIN(s), no DISTINCT — verify no row duplication
- `public.et_preview_document_list_2` — 10 LEFT JOIN(s), no DISTINCT — verify no row duplication
- `public.et_realtime_export_annotations_summary` — 5 LEFT JOIN(s), no DISTINCT — verify no row duplication
- `public.et_realtime_export_annotations_summary_test` — 5 LEFT JOIN(s), no DISTINCT — verify no row duplication
- `public.et_realtime_issuelist_group` — 9 LEFT JOIN(s), no DISTINCT — verify no row duplication
- `public.et_realtime_issuelist_group_backup` — 4 LEFT JOIN(s), no DISTINCT — verify no row duplication
- `public.et_realtime_sessiondata` — 4 LEFT JOIN(s), no DISTINCT — verify no row duplication
- `public.et_searched_files` — 5 LEFT JOIN(s), no DISTINCT — verify no row duplication
- `public.et_sidenav_filecontacts_list` — 8 LEFT JOIN(s), no DISTINCT — verify no row duplication
- `public.et_sidenave_tasks_facttaskissues` — 4 LEFT JOIN(s), no DISTINCT — verify no row duplication
- `public.et_sidenave_tasks_facttasks` — 5 LEFT JOIN(s), no DISTINCT — verify no row duplication
- `public.et_sidenave_tasks_filetasks` — 8 LEFT JOIN(s), no DISTINCT — verify no row duplication
- `public.et_workspace_fact_files` — 5 LEFT JOIN(s), no DISTINCT — verify no row duplication
- `public.et_workspace_fact_issues` — 4 LEFT JOIN(s), no DISTINCT — verify no row duplication
- `public.et_workspace_fact_issues_backup` — 8 LEFT JOIN(s), no DISTINCT — verify no row duplication
- `public.et_workspace_fact_list` — 8 LEFT JOIN(s), no DISTINCT — verify no row duplication
- `public.et_workspace_fact_list___07_working ` — 4 LEFT JOIN(s), no DISTINCT — verify no row duplication
- `public.et_workspace_fact_list_correct_backup` — 5 LEFT JOIN(s), no DISTINCT — verify no row duplication
- `public.et_workspace_organize` — 4 LEFT JOIN(s), no DISTINCT — verify no row duplication
- `realtime.et_fact_get_detail_single` — 9 LEFT JOIN(s), no DISTINCT — verify no row duplication
- `realtime.et_factsheet_detail` — 4 LEFT JOIN(s), no DISTINCT — verify no row duplication
- `realtime.et_navigate_facts_bycompany` — 19 LEFT JOIN(s), no DISTINCT — verify no row duplication
- `realtime.et_realtime_issuelist_group` — 5 LEFT JOIN(s), no DISTINCT — verify no row duplication
- `realtime.et_realtime_sessiondata` — 4 LEFT JOIN(s), no DISTINCT — verify no row duplication
- `realtime.et_sessiondata` — 4 LEFT JOIN(s), no DISTINCT — verify no row duplication

</details>

### LOW — MANY_REFCURSORS (19 SPs)

5+ refcursors in one SP. Frontend rarely needs all of them per call. Consider splitting endpoints.

<details><summary>Affected SPs (19)</summary>

- `helpcenter.et_help_module_iu` — 6 refcursors
- `helpcenter.et_help_sub_module_iu` — 6 refcursors
- `public.et_admin_insertupdate_case` — 6 refcursors
- `public.et_case_contactbuilder` — 10 refcursors
- `public.et_companybuilder` — 5 refcursors
- `public.et_contact_case_rolebuilder` — 5 refcursors
- `public.et_contact_rolebuilder` — 5 refcursors
- `public.et_contactbuilder` — 6 refcursors
- `public.et_get_bundle_links` — 7 refcursors
- `public.et_realtime_insertupdate_session` — 6 refcursors
- `public.et_sectionbuilder` — 6 refcursors
- `public.et_share_links` — 6 refcursors
- `public.et_tag_builder` — 9 refcursors
- `public.et_teambuilder` — 5 refcursors
- `public.et_userbuilder` — 5 refcursors
- `realtime.et_manage_comments` — 7 refcursors
- `realtime.et_server_builder` — 5 refcursors
- `realtime.et_sessions_builder` — 7 refcursors
- `transcript.et_theme_builder` — 5 refcursors

</details>

### LOW — VERY_LONG_BODY (18 SPs)

> 300 lines. Refactoring candidate — split into helper SPs or move orchestration to the application.

<details><summary>Affected SPs (18)</summary>

- `public.et_admin_bundles_filetypes` — 470 lines
- `public.et_admin_bundles_filetypes_backup` — 541 lines
- `public.et_admin_bundles_filetypes_backup1312026` — 470 lines
- `public.et_admin_bundles_filetypes_test` — 469 lines
- `public.et_admin_bundles_filetypes_today_backup` — 541 lines
- `public.et_admin_searched_bundles` — 343 lines
- `public.et_admin_searched_bundles_test` — 343 lines
- `public.et_bundledetail_backup1` — 368 lines
- `public.et_bundledetail_search` — 523 lines
- `public.et_bundledetail_search_test` — 523 lines
- `public.et_bundledetail_with_filter` — 377 lines
- `public.et_displayfiles` — 331 lines
- `public.et_navigate_get_all` — 350 lines
- `public.et_navigate_get_all_test` — 347 lines
- `realtime.et_navigate_get_all` — 404 lines
- `realtime.et_navigate_get_all_backup` — 362 lines
- `realtime.filter_marknav` — 341 lines
- `realtime.filter_marknav` — 347 lines

</details>

### LOW — HEAVY_JSON_PARAM_PARSING (2 SPs)

30+ `parameter ->>` accesses. SP is taking too many inputs. Each access re-parses the JSON.

<details><summary>Affected SPs (2)</summary>

- `transcript.et_theme_builder` — 39 parameter ->> accesses
- `transcript.et_transcripts_builder` — 38 parameter ->> accesses

</details>

### LOW — DYNAMIC_SQL (1 SPs)

EXECUTE with proper USING binding. Worth reviewing for plan-cache-defeating patterns.

<details><summary>Affected SPs (1)</summary>

- `public.et_log_insert` — 1 EXECUTE w/ USING

</details>

