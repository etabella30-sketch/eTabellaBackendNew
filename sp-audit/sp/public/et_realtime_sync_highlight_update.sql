CREATE OR REPLACE FUNCTION public.et_realtime_sync_highlight_update(parameter json, ref refcursor)
 RETURNS refcursor
 LANGUAGE plpgsql
AS $function$
DECLARE
    jHighlights jsonb;jMap jsonb; jNHighlights jsonb;jNMap jsonb;jUpdated jsonb;jPages jsonb;nSesid uuid;
BEGIN
    jHighlights := parameter ->> 'jHighlights';
    jMap := parameter ->> 'jMap';
/*
select * from et_realtime_sync_highlight_update ('{"jHighlights":"[{\"nHid\":6,\"cNote\":\"Highlight text\",\"jCordinates\":\"[{\\\"x\\\":100,\\\"y\\\":200}]\",\"nCaseid\":22,\"nSessionId\":57,\"nUserid\":3,\"dCreatedt\":\"2024-09-21T13:58:09.314Z\",\"cPageno\":\"1\",\"cLineno\":\"10\",\"cTPageno\":null,\"cTLineno\":null,\"cTime\":\"00:00\",\"cTTime\":null,\"nLID\":1,\"nRefHid\":0,\"isSynced\":0},{\"nHid\":7,\"cNote\":\"Highlight text\",\"jCordinates\":\"[{\\\"x\\\":100,\\\"y\\\":200}]\",\"nCaseid\":22,\"nSessionId\":57,\"nUserid\":3,\"dCreatedt\":\"2024-09-23T04:07:56.916Z\",\"cPageno\":\"1\",\"cLineno\":\"10\",\"cTPageno\":null,\"cTLineno\":null,\"cTime\":\"00:00\",\"cTTime\":null,\"nLID\":1,\"nRefHid\":0,\"isSynced\":0},{\"nHid\":8,\"cNote\":\"Highlight text\",\"jCordinates\":\"[{\\\"x\\\":100,\\\"y\\\":200}]\",\"nCaseid\":22,\"nSessionId\":57,\"nUserid\":3,\"dCreatedt\":\"2024-09-23T04:08:49.676Z\",\"cPageno\":null,\"cLineno\":null,\"cTPageno\":\"1\",\"cTLineno\":\"10\",\"cTime\":null,\"cTTime\":\"00:00\",\"nLID\":1,\"nRefHid\":0,\"isSynced\":0},{\"nHid\":10,\"cNote\":\"Highlight text\",\"jCordinates\":\"[{\\\"x\\\":100,\\\"y\\\":200}]\",\"nCaseid\":22,\"nSessionId\":57,\"nUserid\":3,\"dCreatedt\":\"2024-09-23T05:34:53.988Z\",\"cPageno\":\"1\",\"cLineno\":\"10\",\"cTPageno\":null,\"cTLineno\":null,\"cTime\":\"00:00\",\"cTTime\":null,\"nLID\":1,\"nRefHid\":0,\"isSynced\":0},{\"nHid\":11,\"cNote\":\"Highlight text\",\"jCordinates\":\"[{\\\"x\\\":100,\\\"y\\\":200}]\",\"nCaseid\":22,\"nSessionId\":57,\"nUserid\":3,\"dCreatedt\":\"2024-09-23T08:02:51.952Z\",\"cPageno\":\"1\",\"cLineno\":\"10\",\"cTPageno\":null,\"cTLineno\":null,\"cTime\":\"00:00\",\"cTTime\":null,\"nLID\":1,\"nRefHid\":0,\"isSynced\":0},{\"nHid\":12,\"cNote\":\"Highlight text\",\"jCordinates\":\"[{\\\"x\\\":100,\\\"y\\\":200}]\",\"nCaseid\":22,\"nSessionId\":57,\"nUserid\":3,\"dCreatedt\":\"2024-09-23T08:03:34.363Z\",\"cPageno\":\"1\",\"cLineno\":\"10\",\"cTPageno\":null,\"cTLineno\":null,\"cTime\":\"00:00\",\"cTTime\":null,\"nLID\":1,\"nRefHid\":0,\"isSynced\":0},{\"nHid\":13,\"cNote\":\"Highlight text\",\"jCordinates\":\"[{\\\"x\\\":100,\\\"y\\\":200}]\",\"nCaseid\":22,\"nSessionId\":57,\"nUserid\":3,\"dCreatedt\":\"2024-09-23T08:04:27.454Z\",\"cPageno\":\"1\",\"cLineno\":\"10\",\"cTPageno\":null,\"cTLineno\":null,\"cTime\":\"00:00\",\"cTTime\":null,\"nLID\":1,\"nRefHid\":0,\"isSynced\":0},{\"nHid\":14,\"cNote\":\"Highlight text\",\"jCordinates\":\"[{\\\"x\\\":100,\\\"y\\\":200}]\",\"nCaseid\":22,\"nSessionId\":57,\"nUserid\":3,\"dCreatedt\":\"2024-09-23T08:07:08.720Z\",\"cPageno\":\"1\",\"cLineno\":\"10\",\"cTPageno\":null,\"cTLineno\":null,\"cTime\":\"00:00\",\"cTTime\":null,\"nLID\":1,\"nRefHid\":0,\"isSynced\":0},{\"nHid\":15,\"cNote\":\"Highlight text\",\"jCordinates\":\"[{\\\"x\\\":100,\\\"y\\\":200}]\",\"nCaseid\":22,\"nSessionId\":57,\"nUserid\":3,\"dCreatedt\":\"2024-09-23T08:07:30.904Z\",\"cPageno\":\"1\",\"cLineno\":\"10\",\"cTPageno\":null,\"cTLineno\":null,\"cTime\":\"00:00\",\"cTTime\":null,\"nLID\":1,\"nRefHid\":0,\"isSynced\":0},{\"nHid\":16,\"cNote\":\"Highlight text\",\"jCordinates\":\"[{\\\"x\\\":100,\\\"y\\\":200}]\",\"nCaseid\":22,\"nSessionId\":57,\"nUserid\":3,\"dCreatedt\":\"2024-09-23T08:07:48.223Z\",\"cPageno\":\"1\",\"cLineno\":\"10\",\"cTPageno\":null,\"cTLineno\":null,\"cTime\":\"00:00\",\"cTTime\":null,\"nLID\":1,\"nRefHid\":0,\"isSynced\":0},{\"nHid\":17,\"cNote\":\"Highlight text\",\"jCordinates\":\"[{\\\"x\\\":100,\\\"y\\\":200}]\",\"nCaseid\":22,\"nSessionId\":57,\"nUserid\":3,\"dCreatedt\":\"2024-09-23T08:08:29.552Z\",\"cPageno\":\"1\",\"cLineno\":\"10\",\"cTPageno\":null,\"cTLineno\":null,\"cTime\":\"00:00\",\"cTTime\":null,\"nLID\":1,\"nRefHid\":0,\"isSynced\":0},{\"nHid\":18,\"cNote\":\"Highlight text\",\"jCordinates\":\"[{\\\"x\\\":100,\\\"y\\\":200}]\",\"nCaseid\":22,\"nSessionId\":57,\"nUserid\":3,\"dCreatedt\":\"2024-09-23T08:08:58.120Z\",\"cPageno\":\"1\",\"cLineno\":\"10\",\"cTPageno\":null,\"cTLineno\":null,\"cTime\":\"00:00\",\"cTTime\":null,\"nLID\":1,\"nRefHid\":0,\"isSynced\":0},{\"nHid\":19,\"cNote\":\"Highlight text\",\"jCordinates\":\"[{\\\"x\\\":100,\\\"y\\\":200}]\",\"nCaseid\":22,\"nSessionId\":57,\"nUserid\":3,\"dCreatedt\":\"2024-09-23T08:10:11.085Z\",\"cPageno\":\"1\",\"cLineno\":\"10\",\"cTPageno\":null,\"cTLineno\":null,\"cTime\":\"00:00\",\"cTTime\":null,\"nLID\":1,\"nRefHid\":0,\"isSynced\":0},{\"nHid\":20,\"cNote\":\"Highlight text\",\"jCordinates\":\"[{\\\"x\\\":100,\\\"y\\\":200}]\",\"nCaseid\":22,\"nSessionId\":57,\"nUserid\":3,\"dCreatedt\":\"2024-09-23T08:10:51.972Z\",\"cPageno\":\"1\",\"cLineno\":\"10\",\"cTPageno\":null,\"cTLineno\":null,\"cTime\":\"00:00\",\"cTTime\":null,\"nLID\":1,\"nRefHid\":0,\"isSynced\":0},{\"nHid\":21,\"cNote\":\"Highlight text\",\"jCordinates\":\"[{\\\"x\\\":100,\\\"y\\\":200}]\",\"nCaseid\":22,\"nSessionId\":57,\"nUserid\":3,\"dCreatedt\":\"2024-09-23T08:11:14.864Z\",\"cPageno\":\"1\",\"cLineno\":\"10\",\"cTPageno\":null,\"cTLineno\":null,\"cTime\":\"00:00\",\"cTTime\":null,\"nLID\":1,\"nRefHid\":0,\"isSynced\":0},{\"nHid\":22,\"cNote\":\"Highlight text\",\"jCordinates\":\"[{\\\"x\\\":100,\\\"y\\\":200}]\",\"nCaseid\":22,\"nSessionId\":57,\"nUserid\":3,\"dCreatedt\":\"2024-09-23T08:11:38.890Z\",\"cPageno\":\"1\",\"cLineno\":\"10\",\"cTPageno\":null,\"cTLineno\":null,\"cTime\":\"00:00\",\"cTTime\":null,\"nLID\":1,\"nRefHid\":0,\"isSynced\":0},{\"nHid\":23,\"cNote\":\"Highlight text\",\"jCordinates\":\"[{\\\"x\\\":100,\\\"y\\\":200}]\",\"nCaseid\":22,\"nSessionId\":57,\"nUserid\":3,\"dCreatedt\":\"2024-09-23T08:14:21.737Z\",\"cPageno\":\"1\",\"cLineno\":\"10\",\"cTPageno\":null,\"cTLineno\":null,\"cTime\":\"00:00\",\"cTTime\":null,\"nLID\":1,\"nRefHid\":0,\"isSynced\":0},{\"nHid\":24,\"cNote\":\"Highlight text\",\"jCordinates\":\"[{\\\"x\\\":100,\\\"y\\\":200}]\",\"nCaseid\":22,\"nSessionId\":57,\"nUserid\":3,\"dCreatedt\":\"2024-09-23T11:39:05.251Z\",\"cPageno\":\"1\",\"cLineno\":\"10\",\"cTPageno\":null,\"cTLineno\":null,\"cTime\":\"00:00\",\"cTTime\":null,\"nLID\":1,\"nRefHid\":0,\"isSynced\":0},{\"nHid\":25,\"cNote\":\"Highlight text\",\"jCordinates\":\"[{\\\"x\\\":100,\\\"y\\\":200}]\",\"nCaseid\":22,\"nSessionId\":57,\"nUserid\":3,\"dCreatedt\":\"2024-09-23T11:41:04.051Z\",\"cPageno\":\"1\",\"cLineno\":\"10\",\"cTPageno\":null,\"cTLineno\":null,\"cTime\":\"00:00\",\"cTTime\":null,\"nLID\":1,\"nRefHid\":0,\"isSynced\":0}]","jMap":"[{\"nMapid\":10,\"nHid\":10,\"nIid\":1,\"isSynced\":0,\"nRefMapid\":0,\"nRefHid\":0,\"nRefIid\":0},{\"nMapid\":13,\"nHid\":11,\"nIid\":1,\"isSynced\":0,\"nRefMapid\":0,\"nRefHid\":0,\"nRefIid\":0},{\"nMapid\":14,\"nHid\":12,\"nIid\":1,\"isSynced\":0,\"nRefMapid\":0,\"nRefHid\":0,\"nRefIid\":0},{\"nMapid\":15,\"nHid\":13,\"nIid\":1,\"isSynced\":0,\"nRefMapid\":0,\"nRefHid\":0,\"nRefIid\":0},{\"nMapid\":16,\"nHid\":14,\"nIid\":1,\"isSynced\":0,\"nRefMapid\":0,\"nRefHid\":0,\"nRefIid\":0},{\"nMapid\":17,\"nHid\":15,\"nIid\":1,\"isSynced\":0,\"nRefMapid\":0,\"nRefHid\":0,\"nRefIid\":0},{\"nMapid\":18,\"nHid\":16,\"nIid\":1,\"isSynced\":0,\"nRefMapid\":0,\"nRefHid\":0,\"nRefIid\":0},{\"nMapid\":19,\"nHid\":17,\"nIid\":1,\"isSynced\":0,\"nRefMapid\":0,\"nRefHid\":0,\"nRefIid\":0},{\"nMapid\":20,\"nHid\":18,\"nIid\":1,\"isSynced\":0,\"nRefMapid\":0,\"nRefHid\":0,\"nRefIid\":0},{\"nMapid\":21,\"nHid\":19,\"nIid\":1,\"isSynced\":0,\"nRefMapid\":0,\"nRefHid\":0,\"nRefIid\":0},{\"nMapid\":22,\"nHid\":20,\"nIid\":1,\"isSynced\":0,\"nRefMapid\":0,\"nRefHid\":0,\"nRefIid\":0},{\"nMapid\":23,\"nHid\":21,\"nIid\":1,\"isSynced\":0,\"nRefMapid\":0,\"nRefHid\":0,\"nRefIid\":0},{\"nMapid\":24,\"nHid\":22,\"nIid\":1,\"isSynced\":0,\"nRefMapid\":0,\"nRefHid\":0,\"nRefIid\":0},{\"nMapid\":25,\"nHid\":23,\"nIid\":1,\"isSynced\":0,\"nRefMapid\":0,\"nRefHid\":0,\"nRefIid\":0},{\"nMapid\":28,\"nHid\":6,\"nIid\":1,\"isSynced\":0,\"nRefMapid\":0,\"nRefHid\":0,\"nRefIid\":0},{\"nMapid\":29,\"nHid\":7,\"nIid\":1,\"isSynced\":0,\"nRefMapid\":0,\"nRefHid\":0,\"nRefIid\":0}]"}','r1');fetch all in "r1";

select * From "RHighlights" order by 1 desc
select * From "RHighlightMapid" order by 1 desc

select * from "RHighlights"

select * from temp_cat
select * from temp_issue

 select * from public.et_realtime_sync_highlight_update ('{"jHighlights":"[]","jMap":"[{\"nMapid\":\"eaf8ba2e-41d1-4133-a6f6-c56c4fd24dc6\",\"nHid\":\"3ec44dad-6cb3-46bb-a896-608a0ebfd5b9\",\"nIid\":\"769a2a6c-1340-4b64-9716-9ae1cc05e63b\",\"isSynced\":0,\"nRefMapid\":null,\"serialno\":null,\"nRefHid\":null,\"nRefIid\":null},{\"nMapid\":\"e22b5bb4-929e-4362-8438-a6c5210c500e\",\"nHid\":\"6b326f89-33f7-4837-9cb3-b410fab41d1d\",\"nIid\":\"769a2a6c-1340-4b64-9716-9ae1cc05e63b\",\"isSynced\":0,\"nRefMapid\":null,\"serialno\":null,\"nRefHid\":null,\"nRefIid\":null},{\"nMapid\":\"14680af2-70d4-41c3-b031-d4a89a4e1a34\",\"nHid\":\"344777b7-b121-4ae2-82ca-a3198ac01293\",\"nIid\":\"769a2a6c-1340-4b64-9716-9ae1cc05e63b\",\"isSynced\":0,\"nRefMapid\":null,\"serialno\":null,\"nRefHid\":null,\"nRefIid\":null},{\"nMapid\":\"3763c6c5-9738-439b-8980-c1e93a76293f\",\"nHid\":\"70a7d1e8-38e2-4e63-9bce-5a93acccef26\",\"nIid\":\"769a2a6c-1340-4b64-9716-9ae1cc05e63b\",\"isSynced\":0,\"nRefMapid\":null,\"serialno\":null,\"nRefHid\":null,\"nRefIid\":null},{\"nMapid\":\"eed162c1-5121-4687-b30a-a9ba9f11e52a\",\"nHid\":\"02c02f4d-e589-42ee-a27a-bad1dd678ad6\",\"nIid\":\"769a2a6c-1340-4b64-9716-9ae1cc05e63b\",\"isSynced\":0,\"nRefMapid\":null,\"serialno\":null,\"nRefHid\":null,\"nRefIid\":null},{\"nMapid\":\"191372ec-c3fe-4bac-9da4-81c704d431a8\",\"nHid\":\"fa405afe-b44e-4f71-a780-cfb2570acc0a\",\"nIid\":\"769a2a6c-1340-4b64-9716-9ae1cc05e63b\",\"isSynced\":0,\"nRefMapid\":null,\"serialno\":1,\"nRefHid\":null,\"nRefIid\":null},{\"nMapid\":\"1ada4363-21fd-4c69-842c-8eaafb1ed0cf\",\"nHid\":\"fa405afe-b44e-4f71-a780-cfb2570acc0a\",\"nIid\":\"529e7745-2926-4735-8027-191233e3628e\",\"isSynced\":0,\"nRefMapid\":null,\"serialno\":2,\"nRefHid\":null,\"nRefIid\":null},{\"nMapid\":\"3b4bd538-af22-4b3c-a70f-52b2ee74bf95\",\"nHid\":\"78305f7b-c40e-4ed9-ac49-824a7eed7deb\",\"nIid\":\"769a2a6c-1340-4b64-9716-9ae1cc05e63b\",\"isSynced\":0,\"nRefMapid\":null,\"serialno\":1,\"nRefHid\":null,\"nRefIid\":null},{\"nMapid\":\"fc87a1df-b63f-4896-83b7-901e96a21a97\",\"nHid\":\"78305f7b-c40e-4ed9-ac49-824a7eed7deb\",\"nIid\":\"529e7745-2926-4735-8027-191233e3628e\",\"isSynced\":0,\"nRefMapid\":null,\"serialno\":2,\"nRefHid\":null,\"nRefIid\":null},{\"nMapid\":\"38f841dc-5b80-4314-abc6-12d428a29ce5\",\"nHid\":\"0b0ce4e1-3c29-4b45-a71d-db562a9f23fe\",\"nIid\":\"769a2a6c-1340-4b64-9716-9ae1cc05e63b\",\"isSynced\":0,\"nRefMapid\":null,\"serialno\":1,\"nRefHid\":null,\"nRefIid\":null},{\"nMapid\":\"2094e80e-bcec-446e-984f-e6fe122083db\",\"nHid\":\"0b0ce4e1-3c29-4b45-a71d-db562a9f23fe\",\"nIid\":\"529e7745-2926-4735-8027-191233e3628e\",\"isSynced\":0,\"nRefMapid\":null,\"serialno\":2,\"nRefHid\":null,\"nRefIid\":null},{\"nMapid\":\"ee88113a-40c1-4be5-a496-f344515cf2c6\",\"nHid\":\"5dc84534-f2d6-4ba0-a27f-5cf81fe178c0\",\"nIid\":\"769a2a6c-1340-4b64-9716-9ae1cc05e63b\",\"isSynced\":0,\"nRefMapid\":null,\"serialno\":1,\"nRefHid\":null,\"nRefIid\":null},{\"nMapid\":\"f0b86fa6-83d8-40ef-b9b8-39c54beb08cd\",\"nHid\":\"5dc84534-f2d6-4ba0-a27f-5cf81fe178c0\",\"nIid\":\"529e7745-2926-4735-8027-191233e3628e\",\"isSynced\":0,\"nRefMapid\":null,\"serialno\":2,\"nRefHid\":null,\"nRefIid\":null},{\"nMapid\":\"8233d9c3-73b0-41b9-891e-68a5027aecbc\",\"nHid\":\"3d4d4278-15ee-41f7-ac6b-80a3c6815e36\",\"nIid\":\"769a2a6c-1340-4b64-9716-9ae1cc05e63b\",\"isSynced\":0,\"nRefMapid\":null,\"serialno\":1,\"nRefHid\":null,\"nRefIid\":null},{\"nMapid\":\"e60659ed-4add-4a99-96df-5f85b3848b93\",\"nHid\":\"3d4d4278-15ee-41f7-ac6b-80a3c6815e36\",\"nIid\":\"529e7745-2926-4735-8027-191233e3628e\",\"isSynced\":0,\"nRefMapid\":null,\"serialno\":2,\"nRefHid\":null,\"nRefIid\":null},{\"nMapid\":\"ee54f648-f112-4c75-81c2-d3c6eac2dba0\",\"nHid\":\"753cbdf5-a8b5-4cec-8bdc-98259f2bd63f\",\"nIid\":\"769a2a6c-1340-4b64-9716-9ae1cc05e63b\",\"isSynced\":0,\"nRefMapid\":null,\"serialno\":1,\"nRefHid\":null,\"nRefIid\":null},{\"nMapid\":\"2739ee4b-a7b6-4175-9f74-11e90643b327\",\"nHid\":\"753cbdf5-a8b5-4cec-8bdc-98259f2bd63f\",\"nIid\":\"529e7745-2926-4735-8027-191233e3628e\",\"isSynced\":0,\"nRefMapid\":null,\"serialno\":2,\"nRefHid\":null,\"nRefIid\":null},{\"nMapid\":\"61625115-e0e1-4f63-971b-ff2c530bc725\",\"nHid\":\"bcf01b6f-c4e9-4714-86f2-7849eb430984\",\"nIid\":\"529e7745-2926-4735-8027-191233e3628e\",\"isSynced\":0,\"nRefMapid\":null,\"serialno\":1,\"nRefHid\":null,\"nRefIid\":null},{\"nMapid\":\"f9133936-15f9-437f-8b25-1b44eb400341\",\"nHid\":\"4ca205c8-07ee-41c1-9062-791091d8ff16\",\"nIid\":\"529e7745-2926-4735-8027-191233e3628e\",\"isSynced\":0,\"nRefMapid\":null,\"serialno\":1,\"nRefHid\":null,\"nRefIid\":null},{\"nMapid\":\"e5e3a7ec-bc20-45d4-b28c-91002db97c20\",\"nHid\":\"756817be-dd7e-45ac-9bcb-69f7d7564ec3\",\"nIid\":\"529e7745-2926-4735-8027-191233e3628e\",\"isSynced\":0,\"nRefMapid\":null,\"serialno\":1,\"nRefHid\":null,\"nRefIid\":null},{\"nMapid\":\"29eaa6d4-e58a-4980-857c-f7a5f4049a3a\",\"nHid\":\"627b0364-6725-46c2-8576-cbe340614b10\",\"nIid\":\"529e7745-2926-4735-8027-191233e3628e\",\"isSynced\":0,\"nRefMapid\":null,\"serialno\":1,\"nRefHid\":null,\"nRefIid\":null},{\"nMapid\":\"f6162a0a-ea38-4aab-91e4-5837fc74d762\",\"nHid\":\"0be3c913-5024-4a13-bd8d-b99ce3d80024\",\"nIid\":\"529e7745-2926-4735-8027-191233e3628e\",\"isSynced\":0,\"nRefMapid\":null,\"serialno\":1,\"nRefHid\":null,\"nRefIid\":null},{\"nMapid\":\"bef982dd-e0aa-497c-9220-84a3ff3c09eb\",\"nHid\":\"0be3c913-5024-4a13-bd8d-b99ce3d80024\",\"nIid\":\"769a2a6c-1340-4b64-9716-9ae1cc05e63b\",\"isSynced\":0,\"nRefMapid\":null,\"serialno\":2,\"nRefHid\":null,\"nRefIid\":null},{\"nMapid\":\"acef0ccd-1ccb-44b1-942e-b3e2e447fb9c\",\"nHid\":\"0734f3c5-41b0-400f-9d29-e5ac484cfe6b\",\"nIid\":\"529e7745-2926-4735-8027-191233e3628e\",\"isSynced\":0,\"nRefMapid\":null,\"serialno\":1,\"nRefHid\":null,\"nRefIid\":null},{\"nMapid\":\"b97ff33d-ec16-41fb-98b7-c52b89b31687\",\"nHid\":\"0734f3c5-41b0-400f-9d29-e5ac484cfe6b\",\"nIid\":\"769a2a6c-1340-4b64-9716-9ae1cc05e63b\",\"isSynced\":0,\"nRefMapid\":null,\"serialno\":2,\"nRefHid\":null,\"nRefIid\":null},{\"nMapid\":\"32f343ee-ae3b-40a5-bcd4-e5edb1ce3e3b\",\"nHid\":\"91ac2ae9-80fe-44f0-b7bc-1eb872598f93\",\"nIid\":\"529e7745-2926-4735-8027-191233e3628e\",\"isSynced\":0,\"nRefMapid\":null,\"serialno\":1,\"nRefHid\":null,\"nRefIid\":null},{\"nMapid\":\"f4b84b4f-0ea7-40b8-9152-038571c02a5d\",\"nHid\":\"91ac2ae9-80fe-44f0-b7bc-1eb872598f93\",\"nIid\":\"769a2a6c-1340-4b64-9716-9ae1cc05e63b\",\"isSynced\":0,\"nRefMapid\":null,\"serialno\":2,\"nRefHid\":null,\"nRefIid\":null},{\"nMapid\":\"e116f91f-68e0-4d36-a025-12b29d80f6d6\",\"nHid\":\"ee35a728-12a2-4647-9292-479aca7edf29\",\"nIid\":\"529e7745-2926-4735-8027-191233e3628e\",\"isSynced\":0,\"nRefMapid\":null,\"serialno\":1,\"nRefHid\":null,\"nRefIid\":null},{\"nMapid\":\"4d7bb2f2-d972-4105-86a8-ca4ac60b3d7c\",\"nHid\":\"d7e79b79-f3d3-4c77-ad3e-1a6d533d7cd5\",\"nIid\":\"529e7745-2926-4735-8027-191233e3628e\",\"isSynced\":0,\"nRefMapid\":null,\"serialno\":1,\"nRefHid\":null,\"nRefIid\":null},{\"nMapid\":\"599b9845-6cd2-43c2-bbfd-b273b7a1158c\",\"nHid\":\"39e40df8-617a-4b9e-80c1-6e6da0d5c2e9\",\"nIid\":\"529e7745-2926-4735-8027-191233e3628e\",\"isSynced\":0,\"nRefMapid\":null,\"serialno\":1,\"nRefHid\":null,\"nRefIid\":null},{\"nMapid\":\"64884824-3149-42d4-94b5-810465224a64\",\"nHid\":\"4a63ee36-dc37-4261-9180-e8fc4115b794\",\"nIid\":\"529e7745-2926-4735-8027-191233e3628e\",\"isSynced\":0,\"nRefMapid\":null,\"serialno\":1,\"nRefHid\":null,\"nRefIid\":null},{\"nMapid\":\"1d6c48b5-0c32-453b-afbb-2a05f1868eab\",\"nHid\":\"e681fda7-bfc7-40fe-af98-8720d5b8dccd\",\"nIid\":\"529e7745-2926-4735-8027-191233e3628e\",\"isSynced\":0,\"nRefMapid\":null,\"serialno\":1,\"nRefHid\":null,\"nRefIid\":null},{\"nMapid\":\"65bd76f9-1132-4582-8085-7e43e287fdd2\",\"nHid\":\"cc0d1c40-3d0d-447c-a387-b7696398a7ad\",\"nIid\":\"529e7745-2926-4735-8027-191233e3628e\",\"isSynced\":0,\"nRefMapid\":null,\"serialno\":1,\"nRefHid\":null,\"nRefIid\":null},{\"nMapid\":\"c74afdc1-54c6-4efd-94f8-07fd9ca9dd37\",\"nHid\":\"ded6cceb-7bde-4247-b841-925d7304169f\",\"nIid\":\"529e7745-2926-4735-8027-191233e3628e\",\"isSynced\":0,\"nRefMapid\":null,\"serialno\":1,\"nRefHid\":null,\"nRefIid\":null}]"}','r1');fetch all in "r1";

*/

alter table "RHighlights" add column if not exists "nTempid" int;
alter table "RHighlightMapid" add column if not exists "nTempid" int;

drop table if exists temp_highlight;
create temp table temp_highlight as 
select "nHid","cNote","jCordinates","nCaseid","nSessionId","nUserid","dCreatedt","cPageno","cLineno",
"cTPageno","cTLineno","cTime","cTTime","nLID","nRefHid" as "nRefHid"
From jsonb_to_recordset(jHighlights) as ("nHid" text,"cNote" text,"jCordinates" jsonb,"nCaseid" uuid,"nSessionId" uuid,"nUserid" uuid,"dCreatedt" timestamp,"cPageno" text,"cLineno" text,
"cTPageno" text,"cTLineno" text,"cTime" text,"cTTime" text,"nLID" uuid,"nRefHid" uuid);

drop table if exists temp_mapids;
create temp table temp_mapids as 
select "nMapid","nHid","nIid","nRefMapid" as "nRefMapid","nRefHid","nRefIid","serialno"
From jsonb_to_recordset(jMap) as ("nMapid" text,"nHid" text,"nIid" uuid,"nRefMapid" uuid,"nRefHid" uuid,"nRefIid" uuid,"serialno" int);

		
nSesid = (select "nSessionId" from temp_highlight t where "nSessionId" is not null limit 1);

		with tbl as (
			select  "nHid","cNote","jCordinates","nCaseid","nSessionId","nUserid","dCreatedt","cPageno","cLineno",
			"cTPageno","cTLineno","cTime","cTTime","nLID","nRefHid"
			From temp_highlight 
		),insert_issue as (
			INSERT INTO "RHighlights"( "cNote", "jCordinates", "nCaseid", "nSessionId", "nUserid", "dCreatedt", "cPageno", "cLineno", "cTPageno", "cTLineno", "cTime", "cTTime", "nLID", "nTempid")
			select "cNote","jCordinates","nCaseid","nSessionId","nUserid","dCreatedt","cPageno","cLineno",
			"cTPageno","cTLineno","cTime","cTTime","nLID","nHid"
			from tbl t where "nRefHid" is null
			returning *
		),update_issue as (
			update "RHighlights"  i set  "cNote" = t."cNote", "jCordinates" = t."jCordinates", "nCaseid" = t."nCaseid","cPageno"= t."cPageno", "cLineno"= t."cLineno",
			"cTPageno"= t."cTPageno", "cTLineno"= t."cTLineno", "cTime"= t."cTime", "cTTime"= t."cTTime", "nLID"= t."nLID"
			from tbl t where t."nRefHid" = i."nHid"
			returning *
		),update_temp as (
			update  temp_highlight c set "nRefHid" = t."nHid" from insert_issue t where t."nTempid" = c."nHid"
			returning *
		),newData as (
				select i."nHid",i."nTempid" as "nOHid",i."nUserid"  
				from insert_issue i
		) select jsonb_agg(t) into jNHighlights from newData t;

		with tbl as (
			select "nMapid","nHid","nIid","nRefMapid","nRefHid","nRefIid","serialno"
			from temp_mapids 
		),insert_issue as (
			insert into "RHighlightMapid"("nHid","nIid","nTempid","serialno")
				select coalesce(c."nRefHid",t."nRefHid"),t."nRefIid",t."nMapid",t."serialno"
				from tbl t 
				left join "temp_highlight" c on c."nHid" = t."nHid" 
				where t."nRefMapid" is null
				returning *
		),update_temp as (
				update temp_mapids t set "nRefMapid" = i."nMapid" 
				from insert_issue i where t."nMapid" = i."nTempid" 
				returning *
		),newData as (
				select i."nMapid",i."nTempid" as "nOMapid" ,i."nHid"
				from insert_issue i 				
		) select jsonb_agg(t) into jNMap from newData t; 

-- select * From "RHighlights" order by 1 desc

select jsonb_agg(t) into jPages from (
select jsonb_agg("nHid") as "ids","cPageno","nSessionId" ,"nUserid" 
		From "RHighlights" 
		where (coalesce(jNHighlights,'[]'::jsonb) @> ( '[{"nHid": "'|| "nHid" ||'" }]' )::jsonb) or (coalesce(jNMap,'[]'::jsonb) @> ( '[{"nHid": "'|| "nHid" ||'" }]' )::jsonb)
		group by "cPageno","nSessionId"  ,"nUserid"

)t;
	

	
OPEN ref FOR
	select 1 as msg,nSesid as "nSesid",coalesce(jNHighlights,'[]'::jsonb) as "jNHighlights",coalesce(jNMap,'[]'::jsonb) as "jNMap",coalesce(jPages,'[]'::jsonb) as "jPages";
	
				
		
    RETURN ref;
END;
$function$
