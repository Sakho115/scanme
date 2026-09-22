import { Participant } from '../types/participant';
import { VyugamEvent, VYUGAM_EVENTS, getEventById } from '../types/event';
import { Coordinator } from '../types/coordinator';
import {
  AttendanceRecord,
  AttendanceType,
  CheckinResult,
  OverallStats,
  EventStats,
  ClassificationFilters,
  ClassificationRow,
  CollegeBreakdownRow,
  DepartmentBreakdownRow,
  ParticipantEventSelection,
  SelectedEventInfo
} from '../types/attendance';
import { formatTime } from '../utils/formatting';


// ------------------------------------------------------------
// SEED PARTICIPANTS
// ------------------------------------------------------------
export const SEED_PARTICIPANTS: Participant[] = [
  {
    "id": "8271720f-e896-88a7-b425-f4c84e96cb61",
    "internalId": "8271720fe89688a7b425f4c84e96cb61",
    "name": "Ashok",
    "qrToken": "6f3fef81628c3fb0ad1de62d49d453548b3ba359bc7a6915a77a98027a9e4ec3",
    "college": "pacet",
    "department": "IT",
    "year": "III Year",
    "registrationStatus": "PENDING",
    "email": "sakho01102007@gmail.com",
    "phone": "9.385542007E9"
  },
  {
    "id": "03bdd0c1-c078-64ce-18a1-fc79f80e38e4",
    "internalId": "03bdd0c1c07864ce18a1fc79f80e38e4",
    "name": "Test Delegate",
    "qrToken": "8e2ee04cc2efee77aa552d859ecdc9db86c2cda8c695008a9c9e4f3a0369043e",
    "college": "PA College of Engineering",
    "department": "Information Technology",
    "year": "III Year",
    "registrationStatus": "CANCELLED",
    "passId": "VYG26-00001",
    "email": "test_admin_1788325439289@example.com",
    "phone": "9.87654321E9",
    "reference": "UTR999888777"
  },
  {
    "id": "74e66d94-88c5-d08d-ac95-ecafc5cdefe9",
    "internalId": "74e66d9488c5d08dac95ecafc5cdefe9",
    "name": "Reject Test Delegate",
    "qrToken": "65f63819aed382be606362e76ccae434529ec67a4dc3bb0505813fa5971a1f86",
    "college": "PA College of Engineering",
    "department": "Computer Science",
    "year": "II Year",
    "registrationStatus": "PENDING",
    "email": "test_reject_1788325460743@example.com",
    "phone": "9.876543211E9",
    "reference": "UTR000111222"
  },
  {
    "id": "f4b19e2e-700e-6063-e92d-05b7f8f4e4ab",
    "internalId": "f4b19e2e700e6063e92d05b7f8f4e4ab",
    "name": "Karthik Subramanian",
    "qrToken": "efdfda8da412233d7056e4afdcb49888e5ee77d7e72787ce797f4efc479745e4",
    "college": "P.A. College of Engineering & Technology",
    "department": "Information Technology",
    "year": "III Year",
    "registrationStatus": "CANCELLED",
    "passId": "VYG26-00001-DUP4",
    "email": "test_delegate_1788328125527@vyugam.in",
    "phone": "9.44332211E9",
    "reference": "UTR125527"
  },
  {
    "id": "67e4b8cd-a1bf-5449-04df-891cd3deca0f",
    "internalId": "67e4b8cda1bf544904df891cd3deca0f",
    "name": "Karthik Subramanian",
    "qrToken": "6afd89493b2983e5c94326f2fc2d44b394e84418f820d9a0468434be0b885737",
    "college": "P.A. College of Engineering & Technology",
    "department": "Information Technology",
    "year": "III Year",
    "registrationStatus": "CANCELLED",
    "passId": "VYG26-00001-DUP5",
    "email": "test_delegate_1788328396482@vyugam.in",
    "phone": "9.44332211E9",
    "reference": "UTR396482"
  },
  {
    "id": "0b6cf316-34d1-7de8-5ed4-15d3c7f49517",
    "internalId": "0b6cf31634d17de85ed415d3c7f49517",
    "name": "ashok",
    "qrToken": "40da41810750a29beb68b5fb3636f269cacb85b8ca50387356c3908742e7919a",
    "college": "dffdfd",
    "department": "sfdsfdsfd",
    "year": "I Year",
    "registrationStatus": "PENDING",
    "email": "ash@gmail.com",
    "phone": "9.87654321E9"
  },
  {
    "id": "4d53e75b-74de-e636-a465-dece714bc18c",
    "internalId": "4d53e75b74dee636a465dece714bc18c",
    "name": "abilash",
    "qrToken": "44d94d9ca643943c73a791c274807aa1555b9afbf9f4ee6cf0dc83ff6b73e1bd",
    "college": "asfd",
    "department": "fds",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00001-DUP7",
    "email": "ashok01102007@gmail.com",
    "phone": "9.87654321E9"
  },
  {
    "id": "cdbcb076-7372-d61e-d044-3f8662ae22c6",
    "internalId": "cdbcb0767372d61ed0443f8662ae22c6",
    "name": "Consolidated Delegate",
    "qrToken": "25cbded130c60108bdd64df0c17f3a342bf7b74ed8f9962078d5bba1ce169e2b",
    "college": "PA College",
    "department": "CSE",
    "year": "IV Year",
    "registrationStatus": "PENDING",
    "email": "consolidated_1788333775014@vyugam.in",
    "phone": "9.112233445E9",
    "reference": "UTR777888"
  },
  {
    "id": "2ad3ca12-a194-4b24-1d60-4b83f0d6f803",
    "internalId": "2ad3ca12a1944b241d604b83f0d6f803",
    "name": "CatchAll Delegate",
    "qrToken": "cee6ec5edd91a66a86e62e8f648a73d57cd8e3ce57db6036162ddd3e2cc66bda",
    "college": "VYUGAM Inst",
    "department": "IT",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00002",
    "email": "catchall_1788335708362@vyugam.in",
    "phone": "9.887766554E9",
    "reference": "UTR999000"
  },
  {
    "id": "b4b73a6a-7fd5-6581-69cd-db8066dcc83d",
    "internalId": "b4b73a6a7fd5658169cddb8066dcc83d",
    "name": "Karthik Subramanian",
    "qrToken": "2942eb869af5ae93ff7f935959eef9bd7efa1fdc694a6210457f598347cfbf3e",
    "college": "P.A. College of Engineering & Technology",
    "department": "Information Technology",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00003",
    "email": "test_delegate_1788342178438@vyugam.in",
    "phone": "9.44332211E9",
    "reference": "UTR178438"
  },
  {
    "id": "dd93db12-325b-f9ab-333a-c5fb99fe79f1",
    "internalId": "dd93db12325bf9ab333ac5fb99fe79f1",
    "name": "Verification User",
    "qrToken": "3c9bb5616481f1389805c0a3a08fcd361ba655f466a49e88045aeea582965f29",
    "college": "PA College",
    "department": "CSE",
    "year": "IV Year",
    "registrationStatus": "PENDING",
    "email": "verify_reg_1788342563868@vyugam.in",
    "phone": "9.87654321E9",
    "reference": "UTR563868"
  },
  {
    "id": "d3d73485-5052-215f-9911-c7d0db76a1eb",
    "internalId": "d3d734855052215f9911c7d0db76a1eb",
    "name": "Handler Test User",
    "qrToken": "2a07c46f8c7bd9d31aaadef806984fbc07c8761fdb9eb442a7b6aaceff87e80c",
    "college": "PA College of Engineering and Technology",
    "department": "CSE",
    "year": "IV",
    "registrationStatus": "PENDING",
    "email": "handler_test_1788342610286@vyugam.in",
    "phone": "9.988776655E9",
    "reference": "UTR610286"
  },
  {
    "id": "096048a0-b82e-0d5c-e856-3332a92046ff",
    "internalId": "096048a0b82e0d5ce8563332a92046ff",
    "name": "Test",
    "qrToken": "ba77e41c9c88b0ff8a3e3dc569eef43b29fb5a8c47cfb256535b98c90f49802f",
    "college": "Test College",
    "department": "CSE",
    "year": "IV Year",
    "registrationStatus": "PENDING",
    "email": "test@test.com",
    "phone": "9.988776655E9",
    "reference": "UTR12345"
  },
  {
    "id": "b874311d-6ba4-0715-bf65-c3eb93f2bb6b",
    "internalId": "b874311d6ba40715bf65c3eb93f2bb6b",
    "name": "Local API Verify",
    "qrToken": "bf52526507cff4169f10631a15d629f7ea2e63c75220a7a12e9704d30814a391",
    "college": "PA College",
    "department": "IT",
    "year": "IV Year",
    "registrationStatus": "PENDING",
    "email": "localverify_1788344790260@vyugam.in",
    "phone": "9.87654321E9",
    "reference": "UTR790260"
  },
  {
    "id": "3dfe7a4d-65fe-db4d-507d-54a75c83e7ff",
    "internalId": "3dfe7a4d65fedb4d507d54a75c83e7ff",
    "name": "Full ESM Production Test",
    "qrToken": "a6b0d7196e17dc5f42bea6529308db8b5582f4008f224e6b64844cc2cb3ab04d",
    "college": "PA College of Engineering and Technology",
    "department": "Information Technology",
    "year": "IV Year",
    "registrationStatus": "PENDING",
    "email": "full_esm_1788347174224@vyugam.in",
    "phone": "9.87654321E9",
    "reference": "UTR174224"
  },
  {
    "id": "a3bd99b5-435a-3082-04ab-e2c64dbe1e5e",
    "internalId": "a3bd99b5435a308204abe2c64dbe1e5e",
    "name": "hadfjhdafjag",
    "qrToken": "875c30859e18e6a44c460e5ded4633f007f858be51c7f955251e86cd7ea76ebf",
    "college": "dssgha",
    "department": "it",
    "year": "III Year",
    "registrationStatus": "CANCELLED",
    "passId": "VYG26-00004",
    "email": "ashok1102007@gmail.com",
    "phone": "9.87654321E9"
  },
  {
    "id": "f0a2b8bd-b7a5-4450-b3f2-ff3d37ee0147",
    "internalId": "f0a2b8bdb7a54450b3f2ff3d37ee0147",
    "name": "Karthik Subramanian",
    "qrToken": "0589be7515674acf2df8c838bed5700c61ab639e7ff12dd503590fac19683d0d",
    "college": "P.A. College of Engineering & Technology",
    "department": "Information Technology",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00005",
    "email": "test_delegate_1788385616899@vyugam.in",
    "phone": "9.44332211E9",
    "reference": "UTR616899"
  },
  {
    "id": "a705b56c-969d-f8d8-942f-c6e1c80bfb13",
    "internalId": "a705b56c969df8d8942fc6e1c80bfb13",
    "name": "Karthik Subramanian",
    "qrToken": "8750e6d364c017a4d1d8daff04a81567400c5af63d342e655eca2857e0f12db4",
    "college": "P.A. College of Engineering & Technology",
    "department": "Information Technology",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00006",
    "email": "test_delegate_1788385667358@vyugam.in",
    "phone": "9.44332211E9",
    "reference": "UTR667358"
  },
  {
    "id": "56c0c4d8-e9a7-ee94-113c-bd0e0ecb5f9e",
    "internalId": "56c0c4d8e9a7ee94113cbd0e0ecb5f9e",
    "name": "Karthik Subramanian",
    "qrToken": "4927621d1ebaf06cf6da65e6237789e64699ae730f137188d18bfd1e3d5c979f",
    "college": "P.A. College of Engineering & Technology",
    "department": "Information Technology",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00007",
    "email": "test_delegate_1788385696134@vyugam.in",
    "phone": "9.44332211E9",
    "reference": "UTR696134"
  },
  {
    "id": "90598391-e7c7-7f3a-1b12-560dd5571e48",
    "internalId": "90598391e7c77f3a1b12560dd5571e48",
    "name": "Karthik Subramanian",
    "qrToken": "d15adecc0c75af9ac4bf5633413008c4e58cfc1be3ba939cfdcfee076243518b",
    "college": "P.A. College of Engineering & Technology",
    "department": "Information Technology",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00008",
    "email": "test_delegate_1788387214822@vyugam.in",
    "phone": "9.44332211E9",
    "reference": "UTR214822"
  },
  {
    "id": "f88f6a80-c4cf-ccf0-686b-a4171863a10e",
    "internalId": "f88f6a80c4cfccf0686ba4171863a10e",
    "name": "Karthik Subramanian",
    "qrToken": "99fe4c0a856b7c0b0bac7177e5f9e0019cbffa35d4fdd5086b690bd10aee4a0e",
    "college": "P.A. College of Engineering & Technology",
    "department": "Information Technology",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00009",
    "email": "test_delegate_1788388014567@vyugam.in",
    "phone": "9.44332211E9",
    "reference": "UTR014567"
  },
  {
    "id": "9ffe2761-23a2-dc0a-3467-aa96fc96fc0c",
    "internalId": "9ffe276123a2dc0a3467aa96fc96fc0c",
    "name": "Karthik Subramanian",
    "qrToken": "05f0accf785554bdd2d788b3ca7fdee8b5c576def78aa65f5513f88865c054ef",
    "college": "P.A. College of Engineering & Technology",
    "department": "Information Technology",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00010",
    "email": "test_delegate_1788389715838@vyugam.in",
    "phone": "9.44332211E9",
    "reference": "UTR715838"
  },
  {
    "id": "5a29f364-aa51-a52d-5659-e3ab37aeb683",
    "internalId": "5a29f364aa51a52d5659e3ab37aeb683",
    "name": "Karthik Subramanian",
    "qrToken": "3e62547689520d0642ee3c83c8b7f6eca83e4bb354873ea379a1ab89ae2b9c82",
    "college": "P.A. College of Engineering & Technology",
    "department": "Information Technology",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00011",
    "email": "test_delegate_1788389818968@vyugam.in",
    "phone": "9.44332211E9",
    "reference": "UTR818968"
  },
  {
    "id": "53bfa696-dc92-ea2e-274f-703609e22f96",
    "internalId": "53bfa696dc92ea2e274f703609e22f96",
    "name": "Karthik Subramanian",
    "qrToken": "29e7a925d4884edd8bd50102cedc3f6713d5cdd630506f7ce63d3a33ac156390",
    "college": "P.A. College of Engineering & Technology",
    "department": "Information Technology",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00012",
    "email": "test_delegate_1788392522923@vyugam.in",
    "phone": "9.44332211E9",
    "reference": "UTR522923"
  },
  {
    "id": "d5ef692f-48c2-f8c9-cde4-bf673047b8b0",
    "internalId": "d5ef692f48c2f8c9cde4bf673047b8b0",
    "name": "Karthik Subramanian",
    "qrToken": "1b53aade5373de6eaf61372715a977d49a4fcefd7b45b0d5681bf76cf8dd3205",
    "college": "P.A. College of Engineering & Technology",
    "department": "Information Technology",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00013",
    "email": "test_delegate_1788393082259@vyugam.in",
    "phone": "9.44332211E9",
    "reference": "UTR082259"
  },
  {
    "id": "6790f4c1-3c41-97f1-caca-b153697b6186",
    "internalId": "6790f4c13c4197f1cacab153697b6186",
    "name": "Karthik Subramanian",
    "qrToken": "dde6dc53eb5a2cf6bbd51b3c95b5608bd914a464f96a81f54a6945c7bf73821e",
    "college": "P.A. College of Engineering & Technology",
    "department": "Information Technology",
    "year": "III Year",
    "registrationStatus": "PENDING",
    "email": "test_delegate_1788393733926@vyugam.in",
    "phone": "9.44332211E9",
    "reference": "UTR733926"
  },
  {
    "id": "e359a583-caed-0ab7-4bc2-6928ffe77005",
    "internalId": "e359a583caed0ab74bc26928ffe77005",
    "name": "Karthik Subramanian",
    "qrToken": "d22cc4609a2c8d772f53a3c54831e941d3d14a67e373da703b2dd48d0951cb09",
    "college": "P.A. College of Engineering & Technology",
    "department": "Information Technology",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00014",
    "email": "test_delegate_1788393994307@vyugam.in",
    "phone": "9.44332211E9",
    "reference": "UTR994307"
  },
  {
    "id": "50929dcd-bafa-5f7b-4cc1-0887c25727d5",
    "internalId": "50929dcdbafa5f7b4cc10887c25727d5",
    "name": "Karthik Subramanian",
    "qrToken": "e4b97a958712172e4041565a8417d36367bf36cadf43cf29b814303ce15694ea",
    "college": "P.A. College of Engineering & Technology",
    "department": "Information Technology",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00015",
    "email": "test_delegate_1788394219790@vyugam.in",
    "phone": "9.44332211E9",
    "reference": "UTR219790"
  },
  {
    "id": "9e9635bb-f79d-3e5b-089b-a1866025b833",
    "internalId": "9e9635bbf79d3e5b089ba1866025b833",
    "name": "Karthik Subramanian",
    "qrToken": "8e4dfef1b43cc0f3b9c4e2b34ff63739fca7edb9802b0c093ad077d4e0d87400",
    "college": "P.A. College of Engineering & Technology",
    "department": "Information Technology",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00016",
    "email": "test_delegate_1788394274464@vyugam.in",
    "phone": "9.44332211E9",
    "reference": "UTR274464"
  },
  {
    "id": "7c1a93d4-c621-c25a-1d15-d6f70db423fe",
    "internalId": "7c1a93d4c621c25a1d15d6f70db423fe",
    "name": "Karthik Subramanian",
    "qrToken": "e7b839e6c78d4559d0d384af9355be3a4c1fd5d65062f32ff36ea22aefaff5c8",
    "college": "P.A. College of Engineering & Technology",
    "department": "Information Technology",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00017",
    "email": "test_delegate_1788394346529@vyugam.in",
    "phone": "9.44332211E9",
    "reference": "UTR346529"
  },
  {
    "id": "8451b330-d32c-7452-f932-df04101edf4f",
    "internalId": "8451b330d32c7452f932df04101edf4f",
    "name": "sakho",
    "qrToken": "1ed8ddd2d698cb818e8eefa028d74508de42463cfd8427af222dbaeab22147a6",
    "college": "pacet",
    "department": "it",
    "year": "III Year",
    "registrationStatus": "CANCELLED",
    "passId": "VYG26-00003-DUP31",
    "email": "gardenofwords11@gmail.com",
    "phone": "9.385542007E9"
  },
  {
    "id": "e97b12cf-8bc9-52ea-850e-6c2583be0c41",
    "internalId": "e97b12cf8bc952ea850e6c2583be0c41",
    "name": "Karthik Subramanian",
    "qrToken": "995aa2ca88e89bf4032ed2a849185dbfe0c93360b0cc90afdceef247f7e1a1b0",
    "college": "P.A. College of Engineering & Technology",
    "department": "Information Technology",
    "year": "III Year",
    "registrationStatus": "CANCELLED",
    "passId": "VYG26-00001-DUP32",
    "email": "test_delegate_1788396377150@vyugam.in",
    "phone": "9.44332211E9",
    "reference": "UTR377150"
  },
  {
    "id": "b1d5122d-cda4-118f-3475-e75e59f2e529",
    "internalId": "b1d5122dcda4118f3475e75e59f2e529",
    "name": "Karthik Subramanian",
    "qrToken": "aa8e6d8a9a471d503bb1f1ed267c61bc0845f4e8ad9ac12a6fb82d126aac9c4e",
    "college": "P.A. College of Engineering & Technology",
    "department": "Information Technology",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00002-DUP33",
    "email": "test_delegate_1788397410366@vyugam.in",
    "phone": "9.44332211E9",
    "reference": "UTR410366"
  },
  {
    "id": "afb2b62c-0ca2-bfc8-492d-537f2987658f",
    "internalId": "afb2b62c0ca2bfc8492d537f2987658f",
    "name": "Karthik Subramanian",
    "qrToken": "41066dc7467d58f79b4f77a60d852bf1b453a1ada61b773482476a71a9feeed4",
    "college": "P.A. College of Engineering & Technology",
    "department": "Information Technology",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00004-DUP34",
    "email": "test_delegate_1788399709269@vyugam.in",
    "phone": "9.44332211E9",
    "reference": "UTR709269"
  },
  {
    "id": "d9fc2a19-7737-d0e8-f7a9-fd8c73603b32",
    "internalId": "d9fc2a197737d0e8f7a9fd8c73603b32",
    "name": "Karthik Subramanian",
    "qrToken": "83dc8b3f757d12ee950567e1707457072b39ef02523f9c56a23bde643ed79fe5",
    "college": "P.A. College of Engineering & Technology",
    "department": "Information Technology",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00005-DUP35",
    "email": "test_delegate_1788406109609@vyugam.in",
    "phone": "9.44332211E9",
    "reference": "UTR109609"
  },
  {
    "id": "a669a825-cf5f-4676-e28a-1dd1f29f38f6",
    "internalId": "a669a825cf5f4676e28a1dd1f29f38f6",
    "name": "Karthik Subramanian",
    "qrToken": "1796676e456915c0c7d7bf9ef9800fa79999112400ebfae8bfd9f542feb60342",
    "college": "P.A. College of Engineering & Technology",
    "department": "Information Technology",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00006-DUP36",
    "email": "test_delegate_1788406254807@vyugam.in",
    "phone": "9.44332211E9",
    "reference": "UTR254807"
  },
  {
    "id": "cea75bd2-c12d-740e-3b55-58b8a871583f",
    "internalId": "cea75bd2c12d740e3b5558b8a871583f",
    "name": "Uejdjd",
    "qrToken": "dc26e6e399d0790c884fabf4ec621c77501e478f71c0e46d8d389b208cd0b680",
    "college": "P A",
    "department": "B Tech MBBS",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00007-DUP37",
    "email": "kasperskypremium01@gmail.com",
    "phone": "9.633211878E9",
    "reference": "7.329272929E9"
  },
  {
    "id": "b39c2d13-aa5b-6e2f-3831-6752759b6488",
    "internalId": "b39c2d13aa5b6e2f38316752759b6488",
    "name": "Awww",
    "qrToken": "4c2235cbca6e03a0570c04da85e72ff9801ca8f973fbffabd0c87fc74d3729f1",
    "college": "Pa college",
    "department": "It",
    "year": "IV Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00008-DUP38",
    "email": "hvishnuprasadprasad@gmail.com",
    "phone": "9.344064938E9"
  },
  {
    "id": "b9042686-3dcb-c04c-d684-288cf053e2c6",
    "internalId": "b90426863dcbc04cd684288cf053e2c6",
    "name": "Karthik Subramanian",
    "qrToken": "818c9decb6e3cb15421f0059d6241d903acf0d8087de09757be5a7831b2225b7",
    "college": "P.A. College of Engineering & Technology",
    "department": "Information Technology",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00009-DUP39",
    "email": "test_delegate_1788411956548@vyugam.in",
    "phone": "9.44332211E9",
    "reference": "UTR956548"
  },
  {
    "id": "1217e5ad-dafe-0efd-d904-1a2a6f3755bf",
    "internalId": "1217e5addafe0efdd9041a2a6f3755bf",
    "name": "Karthik Subramanian",
    "qrToken": "06073f394ad72381fcaabc480d5e394b52d5a087c29df46bfb204847560bf7de",
    "college": "P.A. College of Engineering & Technology",
    "department": "Information Technology",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00010-DUP40",
    "email": "test_delegate_1788414760942@vyugam.in",
    "phone": "9.44332211E9",
    "reference": "UTR760942"
  },
  {
    "id": "d56e4058-d968-1f31-885b-2d629a46b302",
    "internalId": "d56e4058d9681f31885b2d629a46b302",
    "name": "Ashok",
    "qrToken": "84e402443f8a746e4a8157c26d33292829c72c03901658f723b76b73855d9e63",
    "college": "P A College",
    "department": "B Tech MD",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00011-DUP41",
    "email": "kasperskypremium02@gmail.com",
    "phone": "9.87654321E9"
  },
  {
    "id": "7954a53e-ced5-1e22-7491-8ed818b693ce",
    "internalId": "7954a53eced51e2274918ed818b693ce",
    "name": "Arundhathi",
    "qrToken": "9c44e68e7c6d53a5638f362368a5f1af1cb5bf9f17fb95614bbe7d6d21ad88a5",
    "college": "PA College",
    "department": "B Tech Paithiyam",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00012-DUP42",
    "email": "tharanirs01@gmail.com",
    "phone": "9.87654321E9",
    "reference": "1.23456789E9"
  },
  {
    "id": "4eea7bbf-5313-78c0-2719-e22ef5ccf9f4",
    "internalId": "4eea7bbf531378c02719e22ef5ccf9f4",
    "name": "Karthik Subramanian",
    "qrToken": "37ec465bb1efd405a67f19aa36ae3824fa935510a4f25d483123152f9904bed0",
    "college": "P.A. College of Engineering & Technology",
    "department": "Information Technology",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00013-DUP43",
    "email": "test_delegate_1788416653598@vyugam.in",
    "phone": "9.44332211E9",
    "reference": "UTR653598"
  },
  {
    "id": "b27c2ac9-0ab1-fa35-b266-cc7eaf94a27d",
    "internalId": "b27c2ac90ab1fa35b266cc7eaf94a27d",
    "name": "Jithin",
    "qrToken": "3e7b5bc620be46e6d0f53eb3614024035ebfb6f063c8cb2d40eadf7dbb8e2c32",
    "college": "Jtsigzkg",
    "department": "IT",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00014-DUP44",
    "email": "jithin2769@gamil.com",
    "phone": "9.4879743E9"
  },
  {
    "id": "9f4a87ca-a70f-797f-cba3-8ea7181c2659",
    "internalId": "9f4a87caa70f797fcba38ea7181c2659",
    "name": "Vishal",
    "qrToken": "02154e3f18fd31f159753423153f773681438577d939866a3a6ed767f95414c6",
    "college": "Vhjj",
    "department": "IT",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00015-DUP45",
    "email": "jithin2769@gmail.com",
    "phone": "9.4879743E9"
  },
  {
    "id": "52281b94-d679-e8c1-d81c-6d8c46c52e22",
    "internalId": "52281b94d679e8c1d81c6d8c46c52e22",
    "name": "Abhilash Haridas",
    "qrToken": "370d7ef88d192cf8d98f934f7fccac30d16474df083830ffe967f170d6ea7e69",
    "college": "Hdbs",
    "department": "8w727",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00016-DUP46",
    "email": "abhiharidas3@gmail.com",
    "phone": "9.87654321E9"
  },
  {
    "id": "47e3cb7c-6c5c-ddb6-d689-ae4ea3855e4f",
    "internalId": "47e3cb7c6c5cddb6d689ae4ea3855e4f",
    "name": "Arunachalam",
    "qrToken": "b7d1991b229443df53c50c4cb00b0c4b9cf3bebe9c84e41f4bb6a1384c896d85",
    "college": "Fryvybt",
    "department": "It",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00018",
    "email": "arunachalammurugan12@gmail.com",
    "phone": "6.374398016E9"
  },
  {
    "id": "6815175d-5d52-2dfe-2524-1c0ce32cc8f1",
    "internalId": "6815175d5d522dfe25241c0ce32cc8f1",
    "name": "Surendar S",
    "qrToken": "aa8f8aa21d39812eb4c6e67494098b105b53511824acc5827e7079a83cf3c55e",
    "college": "Sri Krishna College of Engineering and Technology",
    "department": "IT",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00017-DUP48",
    "email": "surendarsuri1414@gmail.com",
    "phone": "9.360690461E9"
  },
  {
    "id": "e9fd25ff-7bc2-000a-d5ed-33a5a294d6a7",
    "internalId": "e9fd25ff7bc2000ad5ed33a5a294d6a7",
    "name": "Priyadharshan",
    "qrToken": "252fab4324dda047992f2ad212cf21fc991eb212b572d04cff38ea7aef3753f6",
    "college": "P A college of engineering and technology",
    "department": "IT",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00019",
    "email": "dharshan052007@gmail.com",
    "phone": "8.489556256E9"
  },
  {
    "id": "2879610d-4a43-e56e-b5e1-1e764a680c31",
    "internalId": "2879610d4a43e56eb5e11e764a680c31",
    "name": "Darshhan",
    "qrToken": "5e872ac763971c07a83d6c8a850daea7ddf88d70e92f519d8aac9f1129c973e1",
    "college": "Dh",
    "department": "IT",
    "year": "III Year",
    "registrationStatus": "CANCELLED",
    "passId": "VYG26-00021",
    "email": "dghggx@hsh.dd",
    "phone": "9.876543212E9",
    "reference": "3.67373773777E11"
  },
  {
    "id": "6d47de11-f7f6-97b7-d7e2-ed0db6cdc1a3",
    "internalId": "6d47de11f7f697b7d7e2ed0db6cdc1a3",
    "name": "Darshhan",
    "qrToken": "37a8afe77d2c4b664b2a393a4145437afaa1ccc02c06851e0ba53541e005f514",
    "college": "PA",
    "department": "IT",
    "year": "III Year",
    "registrationStatus": "CANCELLED",
    "passId": "VYG26-00020",
    "email": "darshhansp2@gmail.com",
    "phone": "9.994515925E9"
  },
  {
    "id": "5d6c0355-10a4-f4cd-7758-72471f94b41b",
    "internalId": "5d6c035510a4f4cd775872471f94b41b",
    "name": "sjdkfh",
    "qrToken": "53485a653ee9c704dec676275cd2c1afaed49664d0755316acd587b19793bf29",
    "college": "sldfnf",
    "department": "sifd",
    "year": "III Year",
    "registrationStatus": "PENDING",
    "email": "team.nexaverse@gmail.com",
    "phone": "9.87644321E9"
  },
  {
    "id": "f04b0999-092d-8878-b3ee-f02847409022",
    "internalId": "f04b0999092d8878b3eef02847409022",
    "name": "PRIDHIGA S",
    "qrToken": "70b7c2076030bca3791000bd2313e27737d9aa7a45d60727e16827130ab04c67",
    "college": "Government College of Technology Coimbatore",
    "department": "CSE(AIML)",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00022",
    "email": "pridhiga55@gmail.com",
    "phone": "6.385599459E9",
    "reference": "pridhiga55@oksbi"
  },
  {
    "id": "a24994eb-603c-9a17-5c50-a6771aae91c9",
    "internalId": "a24994eb603c9a175c50a6771aae91c9",
    "name": "dvfgbngrb",
    "qrToken": "ff991e65f0b1a281708ef89330f4fdf66cb9a3b80b96b5ee682f80c90c5b790e",
    "college": "hnmghm",
    "department": "hgm",
    "year": "I Year",
    "registrationStatus": "PENDING",
    "email": "sdffbh@dvfdgv.dd",
    "phone": "9.874563215E9",
    "reference": ",kj,45646"
  },
  {
    "id": "45dd382f-32dd-fcb5-d594-77525af87cbf",
    "internalId": "45dd382f32ddfcb5d59477525af87cbf",
    "name": "Dhakshitha Shree K S",
    "qrToken": "f5efcbc16f26d0a56cfd930f7d5f5cb90fbc83909269187ac5a8951ce83f1584",
    "college": "Government College of Technology, Coimbatore",
    "department": "EEE",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00023",
    "email": "dhakshithashree19@gmail.com",
    "phone": "8.903216321E9"
  },
  {
    "id": "a1b22203-14ef-9983-a105-471271835322",
    "internalId": "a1b2220314ef9983a105471271835322",
    "name": "Manoj Kumar R",
    "qrToken": "d047bb47733850a983526887e87d50abfc38839124e22e7ac455cc01c2df8d05",
    "college": "KPR INSTITUTION OF ENGINEERING AND TECHNOLOGY",
    "department": "CSE(AIML)",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00024",
    "email": "mk1673009@gmail.com",
    "phone": "6.369516996E9",
    "reference": "6.25111353083E11"
  },
  {
    "id": "9a4fbb27-5327-ed4b-bf05-5fa8dad7e2cb",
    "internalId": "9a4fbb275327ed4bbf055fa8dad7e2cb",
    "name": "NAVEENKUMAR M",
    "qrToken": "9b4a10587b20fc11da3ca79ca7de0102857b67d9f3c59d50b59dced92a0bb338",
    "college": "KPR INSTITUTION OF ENGINEERING AND TECHNOLOGY",
    "department": "CSE(AIML)",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00025",
    "email": "25aml03@kpriet.ac.in",
    "phone": "9.384782583E9",
    "reference": "6.25113388872E11"
  },
  {
    "id": "4eed8f33-aebd-4b54-2604-3bcbda699838",
    "internalId": "4eed8f33aebd4b5426043bcbda699838",
    "name": "S. Iswarya Parani",
    "qrToken": "1a40b4156d25156e292e39005a28197bac1b03fe49829087cce56c4516ecbef1",
    "college": "kamaraj College of Engineering and Technology",
    "department": "CSE",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00026",
    "email": "iswaryaparani@gmail.com",
    "phone": "9.04230331E9",
    "reference": "6.25270838759E11"
  },
  {
    "id": "8241c002-6c0c-cab9-74b8-b7d3183b7793",
    "internalId": "8241c0026c0ccab974b8b7d3183b7793",
    "name": "K.Jeya Sakthi",
    "qrToken": "22ec24e9ef20cdc0d829c0d092ca8d323ed653b7b90fb4e1df4dda1c375f3735",
    "college": "Kamaraj college of engineering and technology Virudhunagar",
    "department": "CSE",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00027",
    "email": "kmjshreehari@gmail.com",
    "phone": "9.003318919E9",
    "reference": "6.61878253809E11"
  },
  {
    "id": "f42a0fcb-316f-c06c-05c4-15f9085f47d0",
    "internalId": "f42a0fcb316fc06c05c415f9085f47d0",
    "name": "V.Kaviya",
    "qrToken": "963c5ea90b3ddc4d12bbc8ce4730b53bc411116829d410bdb605c043aa1a8b29",
    "college": "Kamaraj College of Engineering and Technology",
    "department": "CSE",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00028",
    "email": "v.kaviya3017kavi@gmail.com",
    "phone": "9.361647412E9",
    "reference": "6.25218341293E11"
  },
  {
    "id": "2c89206a-b5e2-5935-85f7-8578a1aef2f6",
    "internalId": "2c89206ab5e2593585f78578a1aef2f6",
    "name": "Prasanna K",
    "qrToken": "8ea43756bc3c53e822dea1d9f76c091d8f1f18ff2fa3008e14859278622c7f7b",
    "college": "KSR College of Engineering",
    "department": "CSE",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00029",
    "email": "prasannakcse2529@ksrce.ac.in",
    "phone": "7.010661415E9"
  },
  {
    "id": "6faf9126-31ff-4388-81df-6ac79a8b4a8b",
    "internalId": "6faf912631ff438881df6ac79a8b4a8b",
    "name": "Keerthi V",
    "qrToken": "6672ba83e501501c51ceeb9e8bb29fb8d15d2deeb9110e297269e57caf4500b5",
    "college": "KSR college of Engineering",
    "department": "CSE",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00030",
    "email": "keerthivcse25_29@ksrce.ac.in",
    "phone": "9.922545462E9"
  },
  {
    "id": "a4e9939e-449d-3105-7bc0-b8dc36faaf93",
    "internalId": "a4e9939e449d31057bc0b8dc36faaf93",
    "name": "Poonkodi E",
    "qrToken": "3840b02e19b328707ecbaf6affb0872e261a1b13713dabda77a601344441f1f5",
    "college": "KSR College of Engineering",
    "department": "CSE",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00031",
    "email": "poonkodiecse25_29@ksrce.ac.in",
    "phone": "9.361407017E9"
  },
  {
    "id": "296e269f-0219-8397-273f-563998b26b07",
    "internalId": "296e269f02198397273f563998b26b07",
    "name": "Karnika N",
    "qrToken": "97b346477fcb102c6a5f68b9c1281c7695fff0ef98f9ca2f81601ca4bb28be5a",
    "college": "KSR College of Engineering",
    "department": "CSE",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00032",
    "email": "karnikancse25_29@ksrce.ac.in",
    "phone": "9.344633198E9"
  },
  {
    "id": "cff7e359-e8ba-7580-2e69-44a453f66278",
    "internalId": "cff7e359e8ba75802e6944a453f66278",
    "name": "GAYATHRI.M",
    "qrToken": "1dea30b348a69fa24d0d9c66272792236ade61d9b968af287198ed9b7fc37671",
    "college": "Dr.Mahalingam College of Engineering and Technology",
    "department": "EEE",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00033",
    "email": "gmj1242007@gmail.com",
    "phone": "8.220487342E9"
  },
  {
    "id": "73f8c164-e449-4fd5-a18b-f63c5700c80f",
    "internalId": "73f8c164e4494fd5a18bf63c5700c80f",
    "name": "KANISHKAA",
    "qrToken": "6a6c85da25127b6d13ea6bb0d360eab48d397936ce30192874dda56755fad25a",
    "college": "DR.MAHALINGAM COLLEGE OF ENGINEERING AND TECHNOLOGY",
    "department": "EEE",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00034",
    "email": "kanishkaaramu2006@gmail.com",
    "phone": "6.385763391E9"
  },
  {
    "id": "d02f0bee-9a81-adfb-8610-202261ac45b4",
    "internalId": "d02f0bee9a81adfb8610202261ac45b4",
    "name": "MITHUNA J",
    "qrToken": "d3f95859e9b3e0296565944c075d2c1de7249cddbc847f101e4ec8a682477a2e",
    "college": "Dr N.G.P Institute of Technology",
    "department": "BE CSE",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00035",
    "email": "mithunaj2007@gmail.com",
    "phone": "8.939711279E9",
    "reference": "6.25573433441E11"
  },
  {
    "id": "3d7fbf42-d2b5-386c-bf73-6dfd68055bbb",
    "internalId": "3d7fbf42d2b5386cbf736dfd68055bbb",
    "name": "MATHIVANI A",
    "qrToken": "7b3cbd163f50db6cc1396f8ad347bc35adbeb81ab1f53c9b5d55fc28629605fc",
    "college": "Dr.NGP INSTITUTE OF TECHNOLOGY  COIMBATORE",
    "department": "CSE",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00036",
    "email": "mathiiiiii411@gmail.com",
    "phone": "9.363302371E9",
    "reference": "6.2551461004E11"
  },
  {
    "id": "096c1517-0a06-8dc3-3dd9-c4f1f257ba06",
    "internalId": "096c15170a068dc33dd9c4f1f257ba06",
    "name": "Jeyavarshikha G",
    "qrToken": "bbd702b94f4f34f6377f8f27b629cdb33165dcd00d61129f8e1831d5869fb275",
    "college": "Dr.NGP Institute of Technology",
    "department": "CSE",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00037",
    "email": "jeyavarshikha16@gmail.com",
    "phone": "7.550372543E9",
    "reference": "6.62150259359E11"
  },
  {
    "id": "fd87d88b-294a-aea8-478b-cc9f41e6f2d9",
    "internalId": "fd87d88b294aaea8478bcc9f41e6f2d9",
    "name": "Koushiga N",
    "qrToken": "c814da23bda0198dc0bc93515fea9406383fd40a43e0da9a6c5cb1869e2b13b1",
    "college": "Dr. N.G.P Institute of technology",
    "department": "CSE",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00038",
    "email": "koushinallathambi@gmail.com",
    "phone": "8.489838108E9",
    "reference": "koushinallathambi-2@ok hdfcbank"
  },
  {
    "id": "21318792-94a8-189e-99ad-d9b4ea237570",
    "internalId": "2131879294a8189e99add9b4ea237570",
    "name": "Monisha L T",
    "qrToken": "410134db776780e4dbe2913aa078b90dc25828a97c4cdf86609124c50716193c",
    "college": "ERODE SENGUNTHAR ENGINEERING COLLEGE",
    "department": "ARTIFICIAL INTELLIGENCE AND DATA SCIENCE",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00039",
    "email": "monisha246op@gmail.com",
    "phone": "9.342652388E9"
  },
  {
    "id": "c457b9bf-b6b1-5ecd-ae9f-49e4475bd8e0",
    "internalId": "c457b9bfb6b15ecdae9f49e4475bd8e0",
    "name": "NIRANJAN M",
    "qrToken": "d6b5ea3130df6ba7c6aee0520d0b637f3f4d9a788950f27a2c47bdcf16b674e6",
    "college": "ERODE SENGUNTHAR ENGINEERING COLLEGE",
    "department": "ELECTRONIC AND COMMUNICATION ENGINEERING",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00042",
    "email": "jarvisniru@gmail.com",
    "phone": "6.369450466E9"
  },
  {
    "id": "0bb2df2b-16ff-06da-dfea-58547c376cb6",
    "internalId": "0bb2df2b16ff06dadfea58547c376cb6",
    "name": "Harshini S",
    "qrToken": "9313a312aea4aed6e6264db7f2bdbb3d5536773254606322c42a261e80dbb4f7",
    "college": "Erode sengunthar engineering college",
    "department": "CSE",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00043",
    "email": "harshiniprema12@gmail.com",
    "phone": "6.381542534E9",
    "reference": "6.62404010963E11"
  },
  {
    "id": "05026304-c128-c6cc-78c6-f1e1b2f4aaf4",
    "internalId": "05026304c128c6cc78c6f1e1b2f4aaf4",
    "name": "Sharisudha",
    "qrToken": "5499148abb243047f2b36839bae500da20f50bc117a5473ba163054ed8c7182c",
    "college": "Erode Sengunthar Engineering College",
    "department": "M.Tech Computer Science and Engineering",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00040",
    "email": "sharisekar8@gmail.com",
    "phone": "9.442666282E9",
    "reference": "6.25809213986E11"
  },
  {
    "id": "612133f8-f108-3aca-9285-1e9f3084e753",
    "internalId": "612133f8f1083aca92851e9f3084e753",
    "name": "Harshini S",
    "qrToken": "9c0fb1347020c4881b023392e8906084edad017832326e968175ef80ff6fa466",
    "college": "Erode sengunthar engineering college",
    "department": "CSE",
    "year": "III Year",
    "registrationStatus": "CANCELLED",
    "passId": "VYG26-00041",
    "email": "sharim.tech712@gmail.com",
    "phone": "6.381542534E9",
    "reference": "6.62404010963E11"
  },
  {
    "id": "80798ac2-9b3e-a4c9-fa6c-3ae7e0cb2b1d",
    "internalId": "80798ac29b3ea4c9fa6c3ae7e0cb2b1d",
    "name": "ABINAYA SRI S",
    "qrToken": "fa23d17750fa899cd511e7fac74aef161ba10e8345e8c14b5ac1274a3ce076f2",
    "college": "Erode Sengunthar Engineering Coll",
    "department": "IT",
    "year": "III Year",
    "registrationStatus": "PENDING",
    "email": "uma777097@gmail.com",
    "phone": "9.843882555E9"
  },
  {
    "id": "cb16f60e-75f2-fcc2-d053-291978f06877",
    "internalId": "cb16f60e75f2fcc2d053291978f06877",
    "name": "ABINAYA SRI S",
    "qrToken": "1dcb05715df433ed59405ca3bd164a52feb4e1df301f6a47e2067955e257d0ec",
    "college": "Erode sengunthar engineering college",
    "department": "IT/B.tech",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00044",
    "email": "abinayasriindia@gmail.com",
    "phone": "9.843882555E9"
  },
  {
    "id": "6431678f-f70f-ed07-9d6c-b55d4bc0e451",
    "internalId": "6431678ff70fed079d6cb55d4bc0e451",
    "name": "DHARANI S",
    "qrToken": "092394fb6a6df23c632947fad16f50a04a6c159aa1404c925cfb7e0cd8490e8b",
    "college": "Erode Senguthar engeneering college-perudurai",
    "department": "M.Tech(CSE) 5 integrated",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00048",
    "email": "dharanisenthilvel123@gmail.com",
    "phone": "9.361072914E9",
    "reference": "6.25945514696E11"
  },
  {
    "id": "0d0f78fd-b647-49b1-379d-396b6ba2f619",
    "internalId": "0d0f78fdb64749b1379d396b6ba2f619",
    "name": "Mohammed suhail akthar",
    "qrToken": "bcfc2f719f53737d97f02f10167112b244e8536a9dc16262a40e1fd0e641b807",
    "college": "Al ameen engineering college",
    "department": "BE.CSE",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00054",
    "email": "suhailakthar487@gmail.com",
    "phone": "8.75440933E9",
    "reference": "5.061735451E9"
  },
  {
    "id": "49ce5d5c-dfb2-bd26-5278-6c47b72d5e5f",
    "internalId": "49ce5d5cdfb2bd2652786c47b72d5e5f",
    "name": "Shalini.M",
    "qrToken": "32e2fdf491a62ac9af034fa75f03c75ebc1e6c0d669b7c4fd49c72dd969f3e4c",
    "college": "Al ameen engineering college",
    "department": "B.TECH.AIDS",
    "year": "III Year",
    "registrationStatus": "PENDING",
    "email": "shalini.m9894@gmail.com",
    "phone": "8.75440933E9",
    "reference": "5.061839467E9"
  },
  {
    "id": "899238a9-74ec-79e2-9d9f-6f5d0821a200",
    "internalId": "899238a974ec79e29d9f6f5d0821a200",
    "name": "test_ashok",
    "qrToken": "4c2c6c2c8a709e24fd0d256e25a072e7c9009077e0c7343b778948bcfdb8ee5e",
    "college": "pacet",
    "department": "IT",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00045",
    "email": "fitalfivisual@gmail.com",
    "phone": "9.87456123E9"
  },
  {
    "id": "96ada2fb-f4bc-86c3-4b1b-ae306eacc3ec",
    "internalId": "96ada2fbf4bc86c34b1bae306eacc3ec",
    "name": "Shalini.M",
    "qrToken": "8896980b5762fc4b7ca69e841a592d1500a0be96f802e44cf27d392cf07ad765",
    "college": "Al ameen engineering college",
    "department": "B.TECH.AIDS",
    "year": "III Year",
    "registrationStatus": "CANCELLED",
    "passId": "VYG26-00053",
    "email": "zaynabfathima1528@gmail.com",
    "phone": "8.75440933E9",
    "reference": "5.061839467E9"
  },
  {
    "id": "928ac3ce-c182-4221-177f-d1cd57b0ab6d",
    "internalId": "928ac3cec1824221177fd1cd57b0ab6d",
    "name": "Karthik Subramanian",
    "qrToken": "36448c5716fb8a85744e2528b5d2276ce09c9fafd942512b924d329dcc3cb81f",
    "college": "P.A. College of Engineering & Technology",
    "department": "Information Technology",
    "year": "III Year",
    "registrationStatus": "CANCELLED",
    "passId": "VYG26-00046",
    "email": "test_delegate_1789625911123@vyugam.in",
    "phone": "9.44332211E9",
    "reference": "UTR911123"
  },
  {
    "id": "ae88ee9c-19d7-b6ab-3e3b-9a36b632198e",
    "internalId": "ae88ee9c19d7b6ab3e3b9a36b632198e",
    "name": "Karthik Subramanian",
    "qrToken": "e14a3c832a84e48757a6aca452181ac068c5365a3f5bd896680d0973aa581961",
    "college": "P.A. College of Engineering & Technology",
    "department": "Information Technology",
    "year": "III Year",
    "registrationStatus": "CANCELLED",
    "passId": "VYG26-00047",
    "email": "test_delegate_1789625971722@vyugam.in",
    "phone": "9.44332211E9",
    "reference": "UTR971722"
  },
  {
    "id": "6b652782-895d-4acd-0757-eafe5c7758d2",
    "internalId": "6b652782895d4acd0757eafe5c7758d2",
    "name": "Karthik Subramanian",
    "qrToken": "90b1de3e2c3cdfdc8baa2cce8aeeb9d2c4b37cdd423ff50a655d32682349c945",
    "college": "P.A. College of Engineering & Technology",
    "department": "Information Technology",
    "year": "III Year",
    "registrationStatus": "PENDING",
    "email": "test_delegate_1789626684359@vyugam.in",
    "phone": "9.44332211E9",
    "reference": "UTR684359"
  },
  {
    "id": "ad610233-9ee7-0ea5-8912-f375fe3a87e8",
    "internalId": "ad6102339ee70ea58912f375fe3a87e8",
    "name": "Arsath.I",
    "qrToken": "7d6eddbaffbc522c4e00cf23e193b71658391908f992c35d751aca556052ba89",
    "college": "Al ameen engineering college",
    "department": "B.E.MECH",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00052",
    "email": "2025.arsath.i@gmail.com",
    "phone": "7.904865245E9",
    "reference": "5.064315616E9"
  },
  {
    "id": "302620ab-cd89-d95e-3309-744ff9f75b2e",
    "internalId": "302620abcd89d95e3309744ff9f75b2e",
    "name": "Sadhana sri.s",
    "qrToken": "a111bd74d8277ffd01fdf3a3a09e7d3eb8a8b0e711c24bc9e0f32eaf40590d1f",
    "college": "Al ameen engineering  clg",
    "department": "CSE",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00051",
    "email": "sadhanasri477@gmail.com",
    "phone": "7.708985276E9",
    "reference": "5.065698137E9"
  },
  {
    "id": "9bdca09e-f0af-f626-4467-7dfc6ab83345",
    "internalId": "9bdca09ef0aff62644677dfc6ab83345",
    "name": "Kavi Barathi M",
    "qrToken": "9eee4e01f578183dc3aa2158a7bcfbb9c9ea5fb032e66c70c6a1df1d71372459",
    "college": "Dr.N.G.P institute of technology",
    "department": "CSE",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00050",
    "email": "kavibarathims2008@gmail.com",
    "phone": "8.248602298E9",
    "reference": "6.26058776334E11"
  },
  {
    "id": "47feda38-28f9-8b48-09e6-1000ffad75f0",
    "internalId": "47feda3828f98b4809e61000ffad75f0",
    "name": "Kamalesh.B",
    "qrToken": "da0e7eca128f4c2982eaaa4dd74827cddf7e6c8756dbfb1335c704b58f20a720",
    "college": "Dr. Ngp institute of technology",
    "department": "Cse",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00049",
    "email": "25cs071@drngpit.ac.in",
    "phone": "8.438079833E9"
  },
  {
    "id": "4a5ac43a-086b-61ad-4a2a-e3b531377670",
    "internalId": "4a5ac43a086b61ad4a2ae3b531377670",
    "name": "Gopu V",
    "qrToken": "887b9fc45ec84fbfb4dafb422ce4d97cb8a6c7ecdf72796633ebc16abb269297",
    "college": "Dr.NGP institute of technology",
    "department": "AIDS",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00055",
    "email": "gopuvenkateshkumar@gmail.com",
    "phone": "9.360944808E9",
    "reference": "1.29803774578E11"
  },
  {
    "id": "a8ff28c3-b24b-ee9a-7e9f-2b6409fe0010",
    "internalId": "a8ff28c3b24bee9a7e9f2b6409fe0010",
    "name": "Selvapriya S",
    "qrToken": "5f0e10ab769a1d7215ccb19b7d2b020ac0fbe217bc8c9a1aa1108302d26a7a02",
    "college": "Nehru Institute of technology",
    "department": "B.E CSE cybersecurity",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00058",
    "email": "selvapriyaselvan.8161@gmail.com",
    "phone": "8.778488161E9"
  },
  {
    "id": "c7ec3a39-046b-dcc0-6975-f42edec69360",
    "internalId": "c7ec3a39046bdcc06975f42edec69360",
    "name": "Yuvashri P",
    "qrToken": "80cb0477f9157f9c3ea387ce29956c28088e9031060525e68802e5cb45da4036",
    "college": "Nehru institute of technology",
    "department": "BE.cse(cybersecurity)",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00057",
    "email": "yuvashripappanna2609@gmail.com",
    "phone": "8.838128258E9"
  },
  {
    "id": "bea22927-d44c-5873-163b-5e632de11283",
    "internalId": "bea22927d44c5873163b5e632de11283",
    "name": "Harshinipriya P",
    "qrToken": "b47c1bb74c9499d590cb467d4a1990867dd72a8f0e7f97f7af44616667335e50",
    "college": "NEHRU INSTITUTE OF TECHNOLOGY",
    "department": "BE CSE CYBER SECURITY",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00059",
    "email": "harshinipriya6608@gmail.com",
    "phone": "9.78917506E9",
    "reference": "6.6278347224E11"
  },
  {
    "id": "d175d0f6-43fc-7c20-cc21-52ace36f49bb",
    "internalId": "d175d0f643fc7c20cc2152ace36f49bb",
    "name": "Jamuna",
    "qrToken": "91c66f2dd6165169e78a47d6b90153b7cdb8c1b7b27ce06c5921d8ab05b9ce07",
    "college": "Kathir college of engineering",
    "department": "CSE",
    "year": "II Year",
    "registrationStatus": "PENDING",
    "email": "jamunaraj543@gmail.com",
    "phone": "8.122402932E9",
    "reference": "jamunaraj543@okaxis"
  },
  {
    "id": "ccad7459-f513-c7e9-5486-44fa37305486",
    "internalId": "ccad7459f513c7e9548644fa37305486",
    "name": "Jamuna",
    "qrToken": "319f0ec97f57e5e8cb0e4b8097a21c392e6a6b4b5aaaa65c377bda050ae9700c",
    "college": "Kathir college of engineering",
    "department": "CSE",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00056",
    "email": "jamunaraj543@email.com",
    "phone": "8.122402932E9",
    "reference": "Jamunaraj543@okaxis"
  },
  {
    "id": "38ac29de-b773-ac28-615d-df57338e4dd7",
    "internalId": "38ac29deb773ac28615ddf57338e4dd7",
    "name": "Dharanidharan B",
    "qrToken": "dc3db23798d25f5d3fb838ff88808d8df89aa266dba14912d843fd2ab58317c4",
    "college": "Kongunadu college of engineering and technology",
    "department": "IT",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00060",
    "email": "dharanidharanb@zohomail.in",
    "phone": "6.384887855E9",
    "reference": "NEF27e86bc8775d4f1d84c8ac70ad5551f0"
  },
  {
    "id": "23bba8d3-8d35-d449-6e2b-820a245f4a33",
    "internalId": "23bba8d38d35d4496e2b820a245f4a33",
    "name": "BHUVANESHWARAN K",
    "qrToken": "0755eec47a8e9b11a3a94e3c6d60688701ab2cb217b62af55a960a258b0ebe77",
    "college": "Kongunadu college of engineering and technology",
    "department": "IT",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00061",
    "email": "bhuvaneshwarankarikalan0@gmail.com",
    "phone": "7.395912521E9"
  },
  {
    "id": "40858aa6-a342-b807-aab5-7acb4029239f",
    "internalId": "40858aa6a342b807aab57acb4029239f",
    "name": "GOKUL T",
    "qrToken": "47e907609dbf9305543082e2f5445bc5a8cdb8c4f4a93717c11a94b44b2825ad",
    "college": "Kongunadu college of engineering and technology",
    "department": "IT",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00062",
    "email": "thangarasugokul@gmail.com",
    "phone": "8.056394997E9",
    "reference": "3.14992100769E11"
  },
  {
    "id": "6a6e8cd4-db4e-97b5-a3f5-e49a06392f60",
    "internalId": "6a6e8cd4db4e97b5a3f5e49a06392f60",
    "name": "Kabilan",
    "qrToken": "7fbaa84f4a13e3522f97f4b8f04e4f8d537fbe82597416f0149be47b2e5f16d3",
    "college": "Kongunadu college of engineering Trichy",
    "department": "IT",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00063",
    "email": "kabilanganesan2008@gmail.com",
    "phone": "6.381302862E9"
  },
  {
    "id": "e9dc329f-b9ab-4d6c-be85-f69483f6febd",
    "internalId": "e9dc329fb9ab4d6cbe85f69483f6febd",
    "name": "LOGESHWARAN M",
    "qrToken": "fcd8e616ee87b201eba7e6b077e915ae7cb3fd33d8681f5d30376c86078dc196",
    "college": "Kongunadu college of engineering and technology",
    "department": "IT",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00092",
    "email": "logeshwaran94860@gmail.com",
    "phone": "7.603939514E9"
  },
  {
    "id": "b86035e9-93f9-5636-1714-f384a0b3d251",
    "internalId": "b86035e993f956361714f384a0b3d251",
    "name": "Priya",
    "qrToken": "1049dd38a78427ec9e22c2e5fefc90a501c7fd9946dd973122c01b50e9867b1d",
    "college": "Erode Sengunthar Engineering College",
    "department": "IT",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00064",
    "email": "prishzzz2067@gmail.com",
    "phone": "9.500102006E9",
    "reference": "6.62738729655E11"
  },
  {
    "id": "813b0bb9-9137-9919-58f0-48c7cc0b50f3",
    "internalId": "813b0bb99137991958f048c7cc0b50f3",
    "name": "Noorul Jumana M.M",
    "qrToken": "fd79b558d31d531246bc1b37fe0baee32e5ab9efac63d76f0eab72c134352909",
    "college": "Dr.N.G.P.Institute of Technology",
    "department": "CSE",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00065",
    "email": "nooruljumana12@gmail.com",
    "phone": "9.342185827E9",
    "reference": "1.29838523302E11"
  },
  {
    "id": "e32fe15e-e789-40bd-af60-722930f85394",
    "internalId": "e32fe15ee78940bdaf60722930f85394",
    "name": "Pooja Shri K",
    "qrToken": "bb2f95e9f7b4cbacd14f1030945f2cb14eb2a3c08a9a458d4ed05e9b79a85a0e",
    "college": "Dr.N.G.P. Institute of Technology",
    "department": "CSE",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00066",
    "email": "25cs121@drngpit.ac.in",
    "phone": "9.791933358E9",
    "reference": "1.29839150503E11"
  },
  {
    "id": "b16f0f98-2f19-64dd-a6a6-7bdc6712bbf2",
    "internalId": "b16f0f982f1964dda6a67bdc6712bbf2",
    "name": "Logesh Kumar",
    "qrToken": "1ae22fc65a42b5f6967423aa436c25742cef03c5d0975ba40bc18b7b7e868bd5",
    "college": "KPR Institute of Engineering and Technology",
    "department": "CSE(AI ML)",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00067",
    "email": "blklogesh81@gmail.com",
    "phone": "9.524942757E9",
    "reference": "CICAgLiG8lz-BA"
  },
  {
    "id": "94e56433-3d23-5d07-1838-1a762aaf457a",
    "internalId": "94e564333d235d0718381a762aaf457a",
    "name": "Bharathkumar D",
    "qrToken": "daf25cb95fcff5ca3a0ae5a601eceaabc7b3c3e6eda1cda88970727635cc8719",
    "college": "KPRIET",
    "department": "CSE ( AIML)",
    "year": "I Year",
    "registrationStatus": "PENDING",
    "email": "26am012@kpriet.ac.in",
    "phone": "9.843981123E9",
    "reference": "6.26186721456E11"
  },
  {
    "id": "255ad526-203f-ed13-325d-a0bd2dd16191",
    "internalId": "255ad526203fed13325da0bd2dd16191",
    "name": "Bharathkumar D",
    "qrToken": "7541237ad4ad4c4710f6c2ba65adada00cbd03bd1bb4519e4aed11d2576557c7",
    "college": "KPRIET",
    "department": "CSE ( AIML)",
    "year": "I Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00068",
    "email": "26am012@kpriet.ac.in",
    "phone": "9.843981123E9",
    "reference": "6.26186721456E11"
  },
  {
    "id": "f5fb42b2-f6e7-c791-f861-dba9b20a1bca",
    "internalId": "f5fb42b2f6e7c791f861dba9b20a1bca",
    "name": "Shanmugamoorthi R",
    "qrToken": "7c3f275b6ba028051ea3fb7b872b2b791c9443dc3b6a90fab66323c9530c4406",
    "college": "KPR institute of engineering and technology",
    "department": "CSE(AI&ML)",
    "year": "I Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00069",
    "email": "26am099@kpriet.ac.in",
    "phone": "8.60809977E9",
    "reference": "1.29840405279E11"
  },
  {
    "id": "3e43bd1f-082c-a0bc-18f9-94130b4dc96f",
    "internalId": "3e43bd1f082ca0bc18f994130b4dc96f",
    "name": "S.SRI SHANMUGA BHARATHI",
    "qrToken": "9712a1fdf4b37b0e548528f03dede88f8a08720e91436af25ced26a66d57a61e",
    "college": "Dr.N.G.P institute of technology",
    "department": "CSE",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00090",
    "email": "bharathisenthil0808@gmail.com",
    "phone": "9.500497906E9"
  },
  {
    "id": "f72a752a-0112-6821-1533-5cbf844e13c5",
    "internalId": "f72a752a0112682115335cbf844e13c5",
    "name": "Logesh Kumar",
    "qrToken": "33d6253d3d72b92ec31469591866ed8765ff4aa4c9a854e36c91525e9662afb8",
    "college": "KPR Institute of Engineering and Technology",
    "department": "CSE(AI ML)",
    "year": "II Year",
    "registrationStatus": "PENDING",
    "email": "25am061@kpriet.ac.in",
    "phone": "9.524942757E9",
    "reference": "CICAgLiG8lz-BA"
  },
  {
    "id": "622bed0e-3540-c943-d0ce-a6f1f594292d",
    "internalId": "622bed0e3540c943d0cea6f1f594292d",
    "name": "Shanmugamoorthi R",
    "qrToken": "90012ab1adb1b7632932776533d7d92990952ec66c3175d274a218c9efe3a1b1",
    "college": "KPR institute of engineering and technology",
    "department": "CSE(AI&ML)",
    "year": "I Year",
    "registrationStatus": "PENDING",
    "email": "shanmugamoorthi278@gmail.com",
    "phone": "8.60809977E9"
  },
  {
    "id": "c43f63d6-fd44-1436-81e8-1aa4e6091403",
    "internalId": "c43f63d6fd44143681e81aa4e6091403",
    "name": "ABISHEK R",
    "qrToken": "26538ffcddea3186279051122233a6c75d9b47b2c86b576b8bb4678cbfdc25f8",
    "college": "Kongunadu college of engineering and technology",
    "department": "IT",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00093",
    "email": "abishekbaby2006@gmail.com",
    "phone": "9.345661612E9"
  },
  {
    "id": "8b85949a-5174-02b7-2de8-dbf1b377c3ba",
    "internalId": "8b85949a517402b72de8dbf1b377c3ba",
    "name": "Logesh Kumar",
    "qrToken": "c29fb092da61b3f2d3bcfb208b8e8014265ecddee0eb85b721b9137885f4a16b",
    "college": "KPR Institute of Engineering and Technology",
    "department": "CSE(AI ML)",
    "year": "II Year",
    "registrationStatus": "PENDING",
    "email": "loge.earnhub@gmail.com",
    "phone": "9.524942757E9"
  },
  {
    "id": "e5ad06c7-27dd-da5b-1c1f-bf3990373aaa",
    "internalId": "e5ad06c727ddda5b1c1fbf3990373aaa",
    "name": "Ramya K",
    "qrToken": "9dfeaa75ea53bb5445c2edf4817c841c3e00ee4411a683aed3f3d7cfcbfbd249",
    "college": "Sri eshwar college of engineering",
    "department": "AIDS",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00071",
    "email": "kalpanaramya22@gmail.com",
    "phone": "8.438997369E9"
  },
  {
    "id": "21a485bf-bef3-e7fe-4158-149a6ac43309",
    "internalId": "21a485bfbef3e7fe4158149a6ac43309",
    "name": "Prahul Ram G S",
    "qrToken": "3d19d4d77430d3877300e905cc89a4c7294ea09026ee639279380a078cab2954",
    "college": "KPRIET",
    "department": "CSE(AI&ML)",
    "year": "I Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00070",
    "email": "26am071@kpriet.ac.in",
    "phone": "8.807767049E9"
  },
  {
    "id": "3f0d43ad-1747-0823-44be-f87d4a537e2c",
    "internalId": "3f0d43ad1747082344bef87d4a537e2c",
    "name": "Ramya M",
    "qrToken": "1cc6a8250b16436bcbbe1c937a8da2f5a6fc415e4025afc57c7045b3a890fc21",
    "college": "Dr.N.G.P institute of technology",
    "department": "CSE",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00072",
    "email": "ramyamurugan8002@gmail.com",
    "phone": "9.791297761E9",
    "reference": "6.26217949192E11"
  },
  {
    "id": "a4996cfd-2b4f-9d59-0777-719900ebf70d",
    "internalId": "a4996cfd2b4f9d590777719900ebf70d",
    "name": "Subasri K",
    "qrToken": "26686df626e37d68521929246a66dca821f46fe6802e56b1b1d4116acc5c4aca",
    "college": "Dr. Mahalingam college of engineering and technology",
    "department": "AIDS",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00073",
    "email": "sksubasri11@gmail.com",
    "phone": "9.345561592E9",
    "reference": "6.26260138381E11"
  },
  {
    "id": "cc0b5475-df32-f599-aa3f-d9146d1c2ce7",
    "internalId": "cc0b5475df32f599aa3fd9146d1c2ce7",
    "name": "Kalai Arasi.M",
    "qrToken": "3bb393ee2c584ec6302bfeb74fb8ebd89b5db10062e6baa8e7e38ae62dc59ace",
    "college": "Dr Mahalingam college of engineering and technology",
    "department": "AI&DS",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00074",
    "email": "kalaiarasimk2007@gmail.com",
    "phone": "9.360679353E9",
    "reference": "6.26283062157E11"
  },
  {
    "id": "82f12dbb-17fb-2fcf-6508-1e577cd2748e",
    "internalId": "82f12dbb17fb2fcf65081e577cd2748e",
    "name": "Dhansha T",
    "qrToken": "aec772b1e5e0a919f6fd288b78b902e631b65ea07f79f7b2dcda48a61e2bdc2b",
    "college": "Dr.mahalingam college of engineering and technology",
    "department": "AI&DS",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00075",
    "email": "dhanshakala741@gmail.com",
    "phone": "6.381684695E9"
  },
  {
    "id": "a057b5bf-1080-83fc-f182-bd2d4541b76b",
    "internalId": "a057b5bf108083fcf182bd2d4541b76b",
    "name": "Kovika Harshini V",
    "qrToken": "e4ec940b626de25412261541e82c99f6c614486c4092aaf79a0018c2049d10e3",
    "college": "Dr.mahalingam college of engineering and technology",
    "department": "AI&DS",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00076",
    "email": "kovikaharshini08@gmail.com",
    "phone": "7.200828278E9"
  },
  {
    "id": "4b5536c0-873f-4b76-50e6-4d5c5a78f46d",
    "internalId": "4b5536c0873f4b7650e64d5c5a78f46d",
    "name": "SALINI.S",
    "qrToken": "53b0448ee37a68480aa367de9ae9a98109dace1b627da95384812cbb558f17c7",
    "college": "Dr.mahalingam College of engineering and technology",
    "department": "B.E AUTOMOBILE",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00077",
    "email": "shalinisakthijws@gmail.com",
    "phone": "9.750191045E9"
  },
  {
    "id": "ee1a79a0-0ace-8971-e9c6-cfba85a80a0f",
    "internalId": "ee1a79a00ace8971e9c6cfba85a80a0f",
    "name": "Radha S",
    "qrToken": "db34c05549661cb03683b4e5315d0cd94e8c986939f5d740e30f19f7fb036e3d",
    "college": "Dr Mahalingam college of engineering and technology Pollachi",
    "department": "B.E automobile engineering",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00078",
    "email": "radhar05421@gmail.com",
    "phone": "8.778799312E9"
  },
  {
    "id": "4ea7f721-dbf4-b57d-a4c3-77a52bafb9c0",
    "internalId": "4ea7f721dbf4b57da4c377a52bafb9c0",
    "name": "P. Kalpana",
    "qrToken": "09ba34cd006f5550219859e7798455fb415b19fed57159c9b078d280665fef51",
    "college": "Dr. Mahalingam college of engineering and technology",
    "department": "Automobile B.E",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00079",
    "email": "kalupu1234@gmail.com",
    "phone": "6.385346244E9"
  },
  {
    "id": "d8ac84e7-47e0-739b-52db-a67326c14af4",
    "internalId": "d8ac84e747e0739b52dba67326c14af4",
    "name": "Dhivya Dharshini",
    "qrToken": "a9553689dbe242fecf49d4358f8507dac29fbf4f41492d6292c97e96c901bc57",
    "college": "Erode Sengunthar Engineering college",
    "department": "B.E-CSE(AIML)",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00080",
    "email": "sdhivya0322@gmail.com",
    "phone": "6.385862949E9",
    "reference": "5.120358633E9"
  },
  {
    "id": "d7e4b197-3a2c-1092-b684-623cd5d8f01e",
    "internalId": "d7e4b1973a2c1092b684623cd5d8f01e",
    "name": "ASHIKA A",
    "qrToken": "0929a2e404deea18774cc6fda5c027096dff5e60960c5d3cb8d12c7eac3f5516",
    "college": "Erode Sengunthar engineering college perundurai",
    "department": "BE CSE AIML",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00081",
    "email": "ashikasaithambi@gmail.com",
    "phone": "8.682883422E9",
    "reference": "6.26231783573E11"
  },
  {
    "id": "00a0f1e6-4e1a-d510-7959-68322126df2f",
    "internalId": "00a0f1e64e1ad510795968322126df2f",
    "name": "Durga Devi K",
    "qrToken": "5846d980b1930888dbcc99ba01b9f24ec1139fa062fc3d7331b4718ab2ebc6a9",
    "college": "Dr.Mahalingam college of engineering and technology Pollachi",
    "department": "BE-CSE",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00082",
    "email": "727625bcs041@mcet.in",
    "phone": "8.825690491E9"
  },
  {
    "id": "fc2fd7b7-c1b8-d756-8c3e-ce58d58a9f24",
    "internalId": "fc2fd7b7c1b8d7568c3ece58d58a9f24",
    "name": "Neeraja P",
    "qrToken": "356f827f44799988d5ca8e3ecd3d1174fb32ab2d2c301ce3966e349cea50297e",
    "college": "Arjun college of technology, coimbatore",
    "department": "BE CSE",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00083",
    "email": "neeraja.p@actechnology.in",
    "phone": "9.500617802E9"
  },
  {
    "id": "0b785831-21e6-698b-22ba-6e2dad0a7351",
    "internalId": "0b78583121e6698b22ba6e2dad0a7351",
    "name": "Sham Shiva v k",
    "qrToken": "5ff7a3c9dd9cf3749b50c72e25fecf3bb3268a7cade40e5eb1dbdfceb66c780a",
    "college": "jct college of engineering and technology",
    "department": "B.tech - Ai/ds",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00084",
    "email": "shamsbk1007@gmail.com",
    "phone": "8.940340474E9",
    "reference": "6.62874492906E11"
  },
  {
    "id": "78785f57-a7e5-5b72-7eea-0731c6dc4832",
    "internalId": "78785f57a7e55b727eea0731c6dc4832",
    "name": "Poojashri K",
    "qrToken": "222acb45a77e4562ca87ae94bf1405f89180aff5158bee55445ef36881dd7a1b",
    "college": "Kongunadu College of Engineering And Technology",
    "department": "IT",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00085",
    "email": "poojashrikamaraj11@gmail.com",
    "phone": "8.056925208E9",
    "reference": "1.29877259982E11"
  },
  {
    "id": "a5e68469-0cf5-af92-9849-66a79dc8a4ad",
    "internalId": "a5e684690cf5af92984966a79dc8a4ad",
    "name": "Pavithra S",
    "qrToken": "233a8b12bcee3b3902b590a0ff9a44c105c3b7d57275b1312616db91fc6b3456",
    "college": "Kongunadu College of Engineering And Technology",
    "department": "IT",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00086",
    "email": "pavithrasubramani73@gmail.com",
    "phone": "8.015490448E9",
    "reference": "1.29877574175E11"
  },
  {
    "id": "221e43ef-4ac6-e2d0-e970-966b54618fc2",
    "internalId": "221e43ef4ac6e2d0e970966b54618fc2",
    "name": "Rashika",
    "qrToken": "82804ec113926f2904a3917de9fd6d61a88e5cef26175ae2c73d493800feec71",
    "college": "Kongunadu college of engineering and technology",
    "department": "IT",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00087",
    "email": "rashika2012008@gmail.com",
    "phone": "7.530085742E9",
    "reference": "6.62899706614E11"
  },
  {
    "id": "7760fa20-b22c-3415-9916-8aa2eaf43bec",
    "internalId": "7760fa20b22c341599168aa2eaf43bec",
    "name": "Sanchana P",
    "qrToken": "53d29b381831497a23aa3ed44b42cdb7dce49b990a467ed34bd2639b1c8ee19c",
    "college": "Kongunadu College of Engineering And Technology",
    "department": "IT",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00088",
    "email": "sanchana076@gmail.com",
    "phone": "9.043416471E9",
    "reference": "1.29877930325E11"
  },
  {
    "id": "f1fa42c4-e8a7-16d8-ccfd-005db45b5ef0",
    "internalId": "f1fa42c4e8a716d8ccfd005db45b5ef0",
    "name": "Jagadeesan",
    "qrToken": "73ba990d40ed0eb8404693084d0da53d65186dcf9ca8874bd416aaf191892453",
    "college": "KPR Institute of Engineering and Technology",
    "department": "CSE(AI ML)",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00089",
    "email": "25am035@kpriet.ac.in",
    "phone": "7.812878245E9"
  },
  {
    "id": "2ab615fd-57d6-9160-3682-7563162727e7",
    "internalId": "2ab615fd57d6916036827563162727e7",
    "name": "V.Vennila",
    "qrToken": "1fbdc8ea8361be7bca5157be3c1317c93d4356e3f1952da723214304e61ed508",
    "college": "Kongunadu college of engineering and technology",
    "department": "IT",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00091",
    "email": "vvennila122008@gmail.com",
    "phone": "8.778909125E9",
    "reference": "1.29880112065E11"
  },
  {
    "id": "e352ff42-f19d-9189-eb06-1b32b1bd5e97",
    "internalId": "e352ff42f19d9189eb061b32b1bd5e97",
    "name": "Rogini P",
    "qrToken": "954915f8203cac7151a96505a509ae6b8ef3a25068a3f655f38f50c530104da8",
    "college": "Dr Mahalingam College of engineering and technology",
    "department": "CSE",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00095",
    "email": "rosy022007@gmail.com",
    "phone": "7.395849718E9",
    "reference": "6.62849700662E11"
  },
  {
    "id": "3c5183bd-1fc5-9c09-f1be-fb073ea80b25",
    "internalId": "3c5183bd1fc59c09f1befb073ea80b25",
    "name": "T.Muneeswari",
    "qrToken": "0c4b0c9ce149506689ee39afd72d4512ec8dba9ea9377744f6819ac05a9abc47",
    "college": "Dr.Mahalingam college of Engineering and Technology",
    "department": "AIDS",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00096",
    "email": "muneeswari1822@gmail.com",
    "phone": "8.438738375E9",
    "reference": "6.62813211205E11"
  },
  {
    "id": "3ae15f04-ed20-dc7f-979b-9711ba1b7c13",
    "internalId": "3ae15f04ed20dc7f979b9711ba1b7c13",
    "name": "Athisha R.G.",
    "qrToken": "4e2f7fe847af9365fc9e84cf377b017ae2fa22aecc67d61a37120c4eeb705f8c",
    "college": "Dr mahalingam college of engineering and technology",
    "department": "AI&DS",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00097",
    "email": "athisharg@gmail.com",
    "phone": "7.402540687E9"
  },
  {
    "id": "6636b4a2-5c02-e6ce-9cf8-60cd05161f7f",
    "internalId": "6636b4a25c02e6ce9cf860cd05161f7f",
    "name": "Karthick Anandh R.J",
    "qrToken": "ec4de01c928c591dc8a2a52b6389d053b57537cbea9c4a3056800ef9c16f9850",
    "college": "KPR Institute of Engineering and Technology",
    "department": "IT",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00098",
    "email": "karthickanandh1304@gmail.com",
    "phone": "9.345664453E9",
    "reference": "CAND7ED7AE619654A4FB3E57A5A79538B1C"
  },
  {
    "id": "e534d570-631e-6c1e-eec2-26ad3c0e0d84",
    "internalId": "e534d570631e6c1eeec226ad3c0e0d84",
    "name": "SWETHA C A",
    "qrToken": "008bb3a29ad209efaa6c965fbb5bb1c8f1b036c51d7094741ebaf6f7142b650b",
    "college": "JCT College of Engineering and Technology",
    "department": "AI&DS",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00099",
    "email": "caswetha0105@gmail.com",
    "phone": "8.870905485E9",
    "reference": "6.62970751745E11"
  },
  {
    "id": "67069262-5e90-c4b2-a490-aabf54b76797",
    "internalId": "670692625e90c4b2a490aabf54b76797",
    "name": "Priyadharshini K",
    "qrToken": "17fee87cd8dfe43ba131ac16f86c5eae6d035c1a2cad2ed25c95a3081d4fffe7",
    "college": "Kongunadu College of Engineering And Technology",
    "department": "IT",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00100",
    "email": "priyadharshniananth@gmail.com",
    "phone": "8.220378393E9",
    "reference": "6.62948359746E11"
  },
  {
    "id": "e617e73d-49b1-6458-4669-3b06c81d020a",
    "internalId": "e617e73d49b1645846693b06c81d020a",
    "name": "Srimathi. R",
    "qrToken": "ab237a6b3cbf47748708be82130242e05a15d73ff73fbfbf0c6117d4ceb03dbc",
    "college": "Dr. Mahalingam college of engineering and technology",
    "department": "CSE",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00101",
    "email": "srimathi17122007@gmail.com",
    "phone": "8.122234725E9"
  },
  {
    "id": "7282da65-4e7d-548a-1414-ba40beb016af",
    "internalId": "7282da654e7d548a1414ba40beb016af",
    "name": "Durgasri",
    "qrToken": "6ce6672877c2859170add17f0585eefcfb87a7cf90a2bd231742748fbffed96b",
    "college": "Dr. Mahalingam college of engineering and technology",
    "department": "Cse",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00102",
    "email": "durgamohan008@gmail.com",
    "phone": "9.976089233E9",
    "reference": "1.29917749007E11"
  },
  {
    "id": "b485d30f-60dd-f26e-8c00-71e35a4767a4",
    "internalId": "b485d30f60ddf26e8c0071e35a4767a4",
    "name": "P.Udhayachandran",
    "qrToken": "548d35b9e8e037f0dc42a3a8a11ea648e13bfad85d212ecc54ea7e786bb3efab",
    "college": "Erode sengunthar engineering college",
    "department": "ECE",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00103",
    "email": "udhay3729@gmail.com",
    "phone": "8.12282937E9",
    "reference": "6.62903475636E11"
  },
  {
    "id": "3ec9a95a-314b-76ea-efd6-f4bf04b4351f",
    "internalId": "3ec9a95a314b76eaefd6f4bf04b4351f",
    "name": "K.Sundaramoorthy",
    "qrToken": "23b7c34c4f5c33c932a6c52b5abc7ec6155f48aeb490faa08732708f01ba9328",
    "college": "Erode sengunthar engineering college",
    "department": "ECE",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00104",
    "email": "sundaramoorthykathirvel25@gmail.com",
    "phone": "9.677374237E9",
    "reference": "6.26362409665E11"
  },
  {
    "id": "5c391c28-f2e4-c0bc-820e-e773314d85b1",
    "internalId": "5c391c28f2e4c0bc820ee773314d85b1",
    "name": "DHANYA.S",
    "qrToken": "5fed1469cf60fed1b0021eb928e1996ca3a6350418298c9cb3a7ffb32b0166e2",
    "college": "Dr.Mahalingam College Of Engineering and Technology",
    "department": "B.E. Automobile engineering",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00105",
    "email": "727625bau009@mcet.in",
    "phone": "9.566590436E9"
  },
  {
    "id": "cd96c3d1-4e5a-db68-660a-d29cc87682e6",
    "internalId": "cd96c3d14e5adb68660ad29cc87682e6",
    "name": "Santhosh A",
    "qrToken": "f79aa3bdc0575a4fa41557a3bf7aa0aff1b8df3537aa97595554c4cbb873d470",
    "college": "Erode sengunthar engineering college",
    "department": "ECE",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00106",
    "email": "santhoshpro067@gmail.com",
    "phone": "9.600995614E9",
    "reference": "1.29926748577E11"
  },
  {
    "id": "66d7beed-ef7f-aa13-70f4-84f10d4f73fb",
    "internalId": "66d7beedef7faa1370f484f10d4f73fb",
    "name": "HEMASHRI K",
    "qrToken": "238615e3ab938424124783032c38c23f0c0ec16d3b2a72beb71c590d97fe1933",
    "college": "Dr.Mahalingam College of engineering and technology",
    "department": "CSE",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00107",
    "email": "k.hemashri008@gmail.com",
    "phone": "9.940509416E9"
  },
  {
    "id": "1dc7246f-3c4c-105b-0a1d-d12e92664e5d",
    "internalId": "1dc7246f3c4c105b0a1dd12e92664e5d",
    "name": "S.Kanimozhi",
    "qrToken": "59f9a19a148fba059814cb29fca98807db395500ee67cf8b6aa59ddbb9b9eda2",
    "college": "Erode sengunthar engneering college",
    "department": "AIML",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00108",
    "email": "kani04176@gmail.com",
    "phone": "7.708505486E9"
  },
  {
    "id": "90ac7005-7b01-e55a-1ebd-e4932a648d81",
    "internalId": "90ac70057b01e55a1ebde4932a648d81",
    "name": "Akshaya",
    "qrToken": "7e83b6a66ac25ec2b3008b3a817507c3ba68422580a4186cfe434c23df1dd5ec",
    "college": "KIT-Kalaingar karunanidhi institute of Technology",
    "department": "Agri",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00109",
    "email": "mm4873880@gmail.com",
    "phone": "7.358963958E9"
  },
  {
    "id": "feafa316-dbb0-6db9-321c-60359e5c9d8d",
    "internalId": "feafa316dbb06db9321c60359e5c9d8d",
    "name": "Nidarshan S R",
    "qrToken": "9ac5ac5cee2eacd04764edd5c360912cc14a9bcd86becab0b6649e0bfaf902bf",
    "college": "Ppg institute of technology",
    "department": "IT",
    "year": "II Year",
    "registrationStatus": "PENDING",
    "passId": "VYG26-00094",
    "email": "mr.nidarshan.sr@gmail.com",
    "phone": "9.361798738E9",
    "reference": "6.26300413782E11"
  },
  {
    "id": "a53ed97f-edc6-8f6f-e81c-6f60924b91f2",
    "internalId": "a53ed97fedc68f6fe81c6f60924b91f2",
    "name": "Nidarshan S R",
    "qrToken": "d56838d17d1e0e94a4cc402fd8c9f21d75da9380407ed555ef73c85f4fc8a5f1",
    "college": "Ppg institute of technology",
    "department": "IT",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00110",
    "email": "mr.nidarshan.sr@outlook.com",
    "phone": "9.361798738E9",
    "reference": "6.26300413782E11"
  },
  {
    "id": "bb64fe63-ebee-5c1d-07e2-d83ab593aecd",
    "internalId": "bb64fe63ebee5c1d07e2d83ab593aecd",
    "name": "Immanuvel Jaba Abishek S",
    "qrToken": "55002b871ed7893af843e9fc5ddcfed19d6b355316748eec46004f5a3dcbf249",
    "college": "Nandha Engineering College",
    "department": "EEE",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00111",
    "email": "immanuveljabaabishek@gmail.com",
    "phone": "9.787066143E9",
    "reference": "T2609202134014884575819"
  },
  {
    "id": "09e074b7-5192-7336-90b1-12a01d229d8d",
    "internalId": "09e074b75192733690b112a01d229d8d",
    "name": "Dharshini P",
    "qrToken": "f39f84bd5fb7aa0b5f93a5559b6c00e569646ad49851835186ef30ceafdc1641",
    "college": "Nandha Engineering College",
    "department": "EEE",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00112",
    "email": "dharshini2007.p@gmail.com",
    "phone": "9.751301651E9",
    "reference": "T2609202139364931650047"
  },
  {
    "id": "9fa21066-68d5-094e-1026-caae6242aeab",
    "internalId": "9fa2106668d5094e1026caae6242aeab",
    "name": "HARI RS",
    "qrToken": "99865736a15ad68193d3651e2adcf3969f362ebb47868179ce5646ec87838a47",
    "college": "Nandha engineering college",
    "department": "EEE",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00113",
    "email": "hari2006rs@gmail.com",
    "phone": "9.677481211E9",
    "reference": "6.26302839275E11"
  },
  {
    "id": "30331c4a-6631-4aca-6dc2-54109f8b107a",
    "internalId": "30331c4a66314aca6dc254109f8b107a",
    "name": "Dharun S",
    "qrToken": "cfdeed5b146ef1d80b4f44621e2995f3e69d981ff87667b77f5df8ce52e8d0d9",
    "college": "Nandha Engineering College",
    "department": "EEE",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00114",
    "email": "dharunsuresh278@gmail.com",
    "phone": "9.942358995E9",
    "reference": "T2609202203540129408433"
  },
  {
    "id": "52d2171a-2dfc-de20-86b8-4d2702a8a414",
    "internalId": "52d2171a2dfcde2086b84d2702a8a414",
    "name": "DEEPAN KARTHIK A M 24IT020",
    "qrToken": "72022e89f13abba52859b00b2dd0259c64be30cf5877ce608ab12677a191d7fb",
    "college": "KPR INSTITUTE OF ENGINEERING AND TECHNOLOGY",
    "department": "IT",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00115",
    "email": "deepankarthikam@gmail.com",
    "phone": "8.939751451E9",
    "reference": "5.175256437E9"
  },
  {
    "id": "76e8f2f7-6643-337c-0dfc-7041f1bffa22",
    "internalId": "76e8f2f76643337c0dfc7041f1bffa22",
    "name": "Sangavi M",
    "qrToken": "4d51791545c3dc99fbfa3a96c5d5a287ef055a45c15323fe227242593e4663cf",
    "college": "JCT college of engineering and technology",
    "department": "AIDS",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00116",
    "email": "sangavimanikandan.2007@gmail.com",
    "phone": "8.438811298E9"
  },
  {
    "id": "a4278350-8102-6233-51dc-1abbeeec8935",
    "internalId": "a42783508102623351dc1abbeeec8935",
    "name": "Mohanapriya M",
    "qrToken": "4286693ffb4b43fcfdc10ac7470ab3e8c1983d667b6f5d856ffc8779c3e00766",
    "college": "Nandha Engineering College",
    "department": "EEE",
    "year": "III Year",
    "registrationStatus": "PENDING",
    "email": "mohanapriymohanapriya@gmail.com",
    "phone": "9.360866702E9",
    "reference": "T2609211005386038089279"
  },
  {
    "id": "0990fbc9-d4f0-571c-da61-e00c6fcaf193",
    "internalId": "0990fbc9d4f0571cda61e00c6fcaf193",
    "name": "Sowmiya M",
    "qrToken": "efd0812168456ed3e58c1aa694e8ea9aafb52d6f289c6d79a31a564479c7fcbd",
    "college": "Nandha engineering college",
    "department": "EEE",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00119",
    "email": "sowmiyamk2007@gmail.com",
    "phone": "9.342474569E9",
    "reference": "6.26489757668E11"
  },
  {
    "id": "c5bca8e0-bc07-2ff9-6cb1-3a0d50fa6c8b",
    "internalId": "c5bca8e0bc072ff96cb13a0d50fa6c8b",
    "name": "Dharanisha S",
    "qrToken": "cb8e318e4a4ae6ba085d83cfc83c23c8ef498313849963f25cf206a18d3c4742",
    "college": "Nandha Engineering College",
    "department": "EEE",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00120",
    "email": "dharanisha2007s@gmail.com",
    "phone": "9.487717738E9",
    "reference": "6.2648115544E11"
  },
  {
    "id": "110483ad-504f-ae9b-71d5-ded96e170de8",
    "internalId": "110483ad504fae9b71d5ded96e170de8",
    "name": "MOHAMED SHAFIQ",
    "qrToken": "9318b1f2101bf98dbbed880d036204ccdcf26961e578a4c53e4878daab9fbcb0",
    "college": "NANDHA ENGINEERING COLLEGE",
    "department": "ELECTRICAL AND ELECTRONICS ENGINEERING",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00121",
    "email": "amshafiq1208@gmail.com",
    "phone": "8.925591208E9",
    "reference": "1.29978059738E11"
  },
  {
    "id": "44f4b807-6caa-adf7-fa85-6e97ad0938b2",
    "internalId": "44f4b8076caaadf7fa856e97ad0938b2",
    "name": "Santhosh C",
    "qrToken": "393daab7ff4d11bc6c19bd59cf6240555d733bd7a71b3a0eb8032915cc93d077",
    "college": "Nandha Engineering College",
    "department": "EEE",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00117",
    "email": "ssanthosh60548@gmail.com",
    "phone": "8.122501373E9",
    "reference": "T2609211018589016940853"
  },
  {
    "id": "4a9057e5-16c5-ec34-4653-ca3ff00a4f65",
    "internalId": "4a9057e516c5ec344653ca3ff00a4f65",
    "name": "PRAVEENA s",
    "qrToken": "0e57f6eda95bfd3813929647be68ee04e384eba2d122fc5976e874cd9fd35b2c",
    "college": "Dr.Mahalingam engineering college of engineering technology",
    "department": "Cse",
    "year": "II Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00122",
    "email": "praveenasaravanakumar3@gmail.com",
    "phone": "6.380824346E9"
  },
  {
    "id": "fdf17c46-d93f-52ef-9cb5-d07a76cdfe8b",
    "internalId": "fdf17c46d93f52ef9cb5d07a76cdfe8b",
    "name": "Mohanapriya M",
    "qrToken": "2a6fb46411aede1e1c9f059e3b5859aac470922e645cc7383ec561f569bdfd4f",
    "college": "Nandha Engineering College",
    "department": "EEE",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00118",
    "email": "immanuveljaba8@gmail.com",
    "phone": "9.360866702E9",
    "reference": "T2609211005386038089279"
  },
  {
    "id": "eed1e1b5-8b1c-ed43-715b-ccb6a1aa8bd3",
    "internalId": "eed1e1b58b1ced43715bccb6a1aa8bd3",
    "name": "Madhumitha. K",
    "qrToken": "b93a9240fd6f6afce12641d8e568976416b823b330725f84288cef6e43d851d4",
    "college": "Akshaya college of engineering and technology",
    "department": "Mechatronics",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00124",
    "email": "24mc009@acetcbe.edu.in",
    "phone": "8.072765829E9"
  },
  {
    "id": "54fe544e-0806-3d2e-f605-e6bd923a370a",
    "internalId": "54fe544e08063d2ef605e6bd923a370a",
    "name": "Deepika S",
    "qrToken": "e25ad87f2d121c6103f10265088a5b2d3d47d8bf82f5375281616a5703307e84",
    "college": "Akshaya college of engineering and technology",
    "department": "B.E Mechatronics Engineering",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00123",
    "email": "24mc006@acetcbe.edu.in",
    "phone": "9.445673994E9"
  },
  {
    "id": "2f772b9d-f4a8-03c7-9728-1690e02a61e4",
    "internalId": "2f772b9df4a803c797281690e02a61e4",
    "name": "Phanindran S B",
    "qrToken": "77fe564495995a44c3c1be09b8bf40f648e6fbb47c3e5d283d63a62581345b37",
    "college": "Akshaya College of Engineering and Technology",
    "department": "Mechatronics Engineering",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00125",
    "email": "24mc015@acetcbe.edu.in",
    "phone": "9.486177086E9",
    "reference": "6.2644125477E11"
  },
  {
    "id": "36fae6ea-8a5c-fed2-da8b-4edb6f9d73ea",
    "internalId": "36fae6ea8a5cfed2da8b4edb6f9d73ea",
    "name": "Swetha K",
    "qrToken": "15f835d9d0dbab16b3bd90167770dbfb160828b95234c07a7d8de2a5a6f44817",
    "college": "Karpagam college of engineering",
    "department": "IT",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00126",
    "email": "swek657@gmail.com",
    "phone": "8.248781553E9"
  },
  {
    "id": "c2459d99-faa7-fc99-7450-23635e88176e",
    "internalId": "c2459d99faa7fc99745023635e88176e",
    "name": "Sonyvijitha.j",
    "qrToken": "aa09af30d0fdd266a16ed2224b6bff6f793e3ae57e781bdb6d77d242c8254a86",
    "college": "Arjun college of technology",
    "department": "Cse",
    "year": "II Year",
    "registrationStatus": "PENDING",
    "email": "sonyvijitha.j@actechnology.in",
    "phone": "8.24828719E9"
  },
  {
    "id": "a573d862-9c00-f41f-5f0d-6fc03603380d",
    "internalId": "a573d8629c00f41f5f0d6fc03603380d",
    "name": "Harini B",
    "qrToken": "42b96659b16eaf182597b25d28297dd3c6311365cdb790ab1886ea2eda755c9f",
    "college": "Karpagam college of engineering",
    "department": "IT",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00127",
    "email": "harini007harini@gmail.com",
    "phone": "6.380709211E9"
  },
  {
    "id": "e9afbaca-f741-2acd-7f21-a55d3942ab78",
    "internalId": "e9afbacaf7412acd7f21a55d3942ab78",
    "name": "Thilliswari p",
    "qrToken": "e91e724704bf4893806e87e8a4961b5c535fe7daa9b6ebf5b127a641852cc2ce",
    "college": "Arjun college of technology",
    "department": "Cse",
    "year": "II Year",
    "registrationStatus": "PENDING",
    "email": "thilliswari.p@actechnology.in",
    "phone": "9.600683489E9"
  },
  {
    "id": "9147d59f-9ac3-80da-476e-c63124a64a9d",
    "internalId": "9147d59f9ac380da476ec63124a64a9d",
    "name": "Nandhini G",
    "qrToken": "bb43b2d6b2ea4322657f2e3d5557c3ce014ae1395fa0dbfde8684c1b8151cd40",
    "college": "Arjun college of technology",
    "department": "Cse",
    "year": "II Year",
    "registrationStatus": "PENDING",
    "email": "nandhin.g@actechnology.in",
    "phone": "7.305035919E9"
  },
  {
    "id": "7d6fb3f4-d6f6-64eb-0918-2b7bc1acf5da",
    "internalId": "7d6fb3f4d6f664eb09182b7bc1acf5da",
    "name": "Janani R",
    "qrToken": "ff0cf03a83a126f038e58fe04d28afa148a8550988cee259bea1bfdb4a756aa2",
    "college": "Karpagam college of engineering",
    "department": "IT",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00128",
    "email": "jananirengasamy467@gmail.com",
    "phone": "9.443860227E9"
  },
  {
    "id": "cfa005ad-8afa-8d05-6c51-808e5448fb8c",
    "internalId": "cfa005ad8afa8d056c51808e5448fb8c",
    "name": "Arunish R",
    "qrToken": "ae3999fcbbf0bdd123a3a9d16d59220866ff028d9828c14c9c059bb05383efd3",
    "college": "Akshaya college of engineering and technology",
    "department": "Mechatronics Engineering",
    "year": "III Year",
    "registrationStatus": "ACTIVE",
    "passId": "VYG26-00129",
    "email": "arunish0014@gmail.com",
    "phone": "8.754989414E9",
    "reference": "6.26477263414E11"
  }
];

// ------------------------------------------------------------
// SEED COORDINATORS
// ------------------------------------------------------------
export const SEED_COORDINATORS: Coordinator[] = [
  {
    id: 'c1000000-0000-0000-0000-000000000001',
    coordinatorCode: 'ADMIN-01',
    name: 'Sakho115 (Admin)',
    role: 'ADMIN',
    eventId: null,
    active: true
  },
  {
    id: 'c1000000-0000-0000-0000-000000000002',
    coordinatorCode: 'CR-OVERALL',
    name: 'Ashwin Kumar (Overall)',
    role: 'OVERALL_COORDINATOR',
    eventId: null,
    active: true
  },
  {
    id: 'c1000000-0000-0000-0000-000000000003',
    coordinatorCode: 'CR-CODE',
    name: 'Rajesh K (Code Crusade)',
    role: 'EVENT_COORDINATOR',
    eventId: 'e1000000-0000-0000-0000-000000000001',
    assignedEventCode: 'CODE_CRUSADE',
    assignedEventSlug: 'code-crusade',
    assignedEventName: 'Code Crusade',
    active: true
  },
  {
    id: 'c1000000-0000-0000-0000-000000000004',
    coordinatorCode: 'CR-LOGIC',
    name: 'Meera S (Logic Arena)',
    role: 'EVENT_COORDINATOR',
    eventId: 'e2000000-0000-0000-0000-000000000002',
    assignedEventCode: 'LOGIC_ARENA',
    assignedEventSlug: 'logic-arena',
    assignedEventName: 'Logic Arena',
    active: true
  },
  {
    id: 'c1000000-0000-0000-0000-000000000005',
    coordinatorCode: 'CR-UIUX',
    name: 'Divya Bharathi (UI/UX)',
    role: 'EVENT_COORDINATOR',
    eventId: 'e3000000-0000-0000-0000-000000000003',
    assignedEventCode: 'UIUX_STUDIO',
    assignedEventSlug: 'uiux-studio',
    assignedEventName: 'UI/UX Studio',
    active: true
  },
  {
    id: 'c1000000-0000-0000-0000-000000000006',
    coordinatorCode: 'CR-TECH',
    name: 'Kavitha M (Tech Tactics)',
    role: 'EVENT_COORDINATOR',
    eventId: 'e4000000-0000-0000-0000-000000000004',
    assignedEventCode: 'TECH_TACTICS',
    assignedEventSlug: 'tech-tactics',
    assignedEventName: 'Tech Tactics',
    active: true
  },
  {
    id: 'c1000000-0000-0000-0000-000000000007',
    coordinatorCode: 'CR-PIXEL',
    name: 'Arun Prasath (Pixel Pulse)',
    role: 'EVENT_COORDINATOR',
    eventId: 'e5000000-0000-0000-0000-000000000005',
    assignedEventCode: 'PIXEL_PULSE',
    assignedEventSlug: 'pixel-pulse',
    assignedEventName: 'Pixel Pulse',
    active: true
  }
];

const STORAGE_KEY_ATTENDANCE = 'vyugam_supabase_attendance_mock_v2';
const STORAGE_KEY_EVENT_SELECTIONS = 'vyugam_supabase_event_selections_mock_v2';

class MockRelationalDatabase {
  private participants: Participant[] = [];
  private events: VyugamEvent[] = [...VYUGAM_EVENTS];
  private coordinators: Coordinator[] = [...SEED_COORDINATORS];
  private attendance: AttendanceRecord[] = [];
  private eventSelections: ParticipantEventSelection[] = [];

  constructor() {
    this.load();
  }

  private load(): void {
    // Single source of truth is Supabase PostgreSQL.
    // Local state is in-memory only for offline tests/demo and never persists as authoritative cross-device state.
    this.participants = [...SEED_PARTICIPANTS];
    this.attendance = [];
    this.eventSelections = [];

    // Clean up any legacy localStorage keys that may cause stale device mismatches
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem(STORAGE_KEY_ATTENDANCE);
        localStorage.removeItem(STORAGE_KEY_EVENT_SELECTIONS);
      } catch {}
    }
  }

  private save(): void {
    // Do NOT write attendance to localStorage. Supabase PostgreSQL is the single source of truth.
  }

  // ------------------------------------------------------------
  // QUERIES
  // ------------------------------------------------------------
  public getParticipants(): Participant[] {
    return this.participants;
  }

  public getEvents(): VyugamEvent[] {
    return this.events;
  }

  public getCoordinators(): Coordinator[] {
    return this.coordinators;
  }

  public findParticipantByQr(token: string): Participant | undefined {
    const clean = token.toLowerCase().trim();
    return this.participants.find(p => 
      p.qrToken.toLowerCase() === clean ||
      (p.passId && p.passId.toLowerCase() === clean) ||
      (p.internalId && p.internalId.toLowerCase() === clean) ||
      p.id.toLowerCase() === clean
    );
  }

  public findParticipantById(id: string): Participant | undefined {
    return this.participants.find(p => p.id === id || p.internalId === id);
  }

  public findCoordinatorByCode(code: string): Coordinator | undefined {
    const clean = code.toUpperCase().trim();
    return this.coordinators.find(c => c.coordinatorCode === clean);
  }

  // ------------------------------------------------------------
  // ATOMIC CHECK-IN RPC REPLICATION
  // ------------------------------------------------------------
  public verifyAndCheckin(params: {
    qrToken: string;
    attendanceType: AttendanceType;
    eventId?: string | null;
    coordinatorId?: string | null;
    eventIds?: string[] | null;
  }): CheckinResult {
    const { qrToken, attendanceType, eventId, coordinatorId, eventIds } = params;

    // 1. Validate attendance type
    if (attendanceType !== 'OVERALL' && attendanceType !== 'EVENT') {
      return {
        status: 'ERROR',
        success: false,
        error: 'Invalid attendance type. Must be OVERALL or EVENT.'
      };
    }

    // 2. Validate event if EVENT attendance
    let targetEvent: VyugamEvent | undefined;
    if (attendanceType === 'EVENT') {
      if (!eventId) {
        return {
          status: 'ERROR',
          success: false,
          error: 'Event is required for EVENT attendance.'
        };
      }
      targetEvent = getEventById(eventId) || this.events.find(e => e.slug === eventId || e.code === eventId);
      if (!targetEvent) {
        return {
          status: 'ERROR',
          success: false,
          error: 'Event not found.'
        };
      }
      if (targetEvent.status !== 'ACTIVE') {
        return {
          status: 'ERROR',
          success: false,
          error: 'This event is not currently active.'
        };
      }
    }

    // 3. Validate coordinator authorization
    let coordinator: Coordinator | undefined;
    if (coordinatorId) {
      coordinator = this.coordinators.find(c => c.id === coordinatorId || c.coordinatorCode === coordinatorId);
      if (!coordinator || !coordinator.active) {
        return {
          status: 'ERROR',
          success: false,
          error: 'Coordinator account is inactive or not found.'
        };
      }

      // Event coordinator boundary check
      if (coordinator.role === 'EVENT_COORDINATOR') {
        if (attendanceType === 'OVERALL' || (targetEvent && coordinator.eventId !== targetEvent.id)) {
          return {
            status: 'UNAUTHORIZED_EVENT',
            success: false,
            error: 'You are not authorized to record attendance for this section.'
          };
        }
      }
    }

    // 4. Find participant by QR token
    const participant = this.findParticipantByQr(qrToken);
    if (!participant) {
      return {
        status: 'INVALID_TOKEN',
        success: false,
        error: 'This QR code is not registered for this event.'
      };
    }

    if (participant.registrationStatus !== 'ACTIVE') {
      return {
        status: 'INACTIVE_PARTICIPANT',
        success: false,
        error: 'Participant registration is inactive or suspended.'
      };
    }

    // 5. Check duplicate attendance
    let existingAttendance: AttendanceRecord | undefined;
    if (attendanceType === 'OVERALL') {
      existingAttendance = this.attendance.find(
        a => a.participantId === participant.id && a.attendanceType === 'OVERALL'
      );
    } else {
      existingAttendance = this.attendance.find(
        a => a.participantId === participant.id && a.attendanceType === 'EVENT' && a.eventId === targetEvent!.id
      );
    }

    if (existingAttendance) {
      const prevCoord = this.coordinators.find(c => c.id === existingAttendance?.coordinatorId);
      const existingSelections = attendanceType === 'OVERALL'
        ? this.getParticipantEventSelections(participant.id)
        : undefined;

      return {
        status: 'ALREADY_CHECKED_IN',
        success: true,
        participant: {
          id: participant.id,
          participantId: participant.internalId,
          passId: participant.passId || 'UNISSUED',
          name: participant.name,
          college: participant.college,
          department: participant.department,
          year: participant.year
        },
        previousCheckin: {
          time: existingAttendance.checkinTime,
          coordinatorName: prevCoord ? prevCoord.name : 'Desk Coordinator',
          coordinatorId: existingAttendance.coordinatorId || undefined,
          checkinId: existingAttendance.id,
          passId: participant.passId || 'UNISSUED',
          eventName: targetEvent?.name
        },
        selectedEvents: existingSelections
      };
    }

    // 6. Validate selected events if OVERALL attendance
    if (attendanceType === 'OVERALL' && eventIds && eventIds.length > 0) {
      for (const eid of eventIds) {
        const ev = this.events.find(e => e.id === eid || e.slug === eid || e.code === eid);
        if (!ev) {
          return {
            status: 'ERROR',
            success: false,
            error: 'One or more selected events do not exist.'
          };
        }
        if (ev.status !== 'ACTIVE') {
          return {
            status: 'ERROR',
            success: false,
            error: `Event '${ev.name}' is not currently active.`
          };
        }
      }
    }

    // 7. Record new attendance
    const newRecord: AttendanceRecord = {
      id: `a${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      participantId: participant.id,
      attendanceType,
      eventId: targetEvent ? targetEvent.id : null,
      coordinatorId: coordinator ? coordinator.id : null,
      checkinTime: new Date().toISOString(),
      status: 'ENTERED'
    };

    this.attendance.unshift(newRecord);

    // 8. Record event selections if OVERALL attendance
    if (attendanceType === 'OVERALL' && eventIds && eventIds.length > 0) {
      for (const eid of eventIds) {
        const ev = this.events.find(e => e.id === eid || e.slug === eid || e.code === eid)!;
        if (!this.eventSelections.some(s => s.participantId === participant.id && s.eventId === ev.id)) {
          this.eventSelections.push({
            id: `pes-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            participantId: participant.id,
            eventId: ev.id,
            selectedAt: new Date().toISOString(),
            selectedBy: coordinator ? coordinator.id : null,
            createdAt: new Date().toISOString()
          });
        }
      }
    }

    this.save();

    const selectedEvents = attendanceType === 'OVERALL'
      ? this.getParticipantEventSelections(participant.id)
      : undefined;

    return {
      status: 'SUCCESS',
      success: true,
      participant: {
        id: participant.id,
        participantId: participant.internalId,
        passId: participant.passId || 'UNISSUED',
        name: participant.name,
        college: participant.college,
        department: participant.department,
        year: participant.year
      },
      checkin: {
        id: newRecord.id,
        checkinTime: newRecord.checkinTime,
        status: newRecord.status,
        attendanceType: newRecord.attendanceType,
        eventId: newRecord.eventId
      },
      selectedEvents
    };
  }

  public getParticipantEventSelections(participantId: string): SelectedEventInfo[] {
    return this.eventSelections
      .filter(s => s.participantId === participantId)
      .map(s => {
        const ev = this.events.find(e => e.id === s.eventId);
        return {
          id: s.eventId,
          code: ev?.code || '',
          name: ev?.name || ''
        };
      });
  }

  public updateParticipantEventSelections(params: {
    participantId: string;
    eventIds: string[];
    coordinatorId?: string | null;
  }): { status: string; success: boolean; selectedEvents?: SelectedEventInfo[]; error?: string } {
    const { participantId, eventIds, coordinatorId } = params;

    if (coordinatorId) {
      const coord = this.coordinators.find(c => c.id === coordinatorId || c.coordinatorCode === coordinatorId);
      if (!coord || (coord.role !== 'ADMIN' && coord.role !== 'OVERALL_COORDINATOR')) {
        return {
          status: 'UNAUTHORIZED_COORDINATOR',
          success: false,
          error: 'Only Admins or Overall Coordinators can update event selections.'
        };
      }
    }

    for (const eid of eventIds) {
      const ev = this.events.find(e => e.id === eid || e.slug === eid || e.code === eid);
      if (!ev) {
        return { status: 'ERROR', success: false, error: 'One or more selected events do not exist.' };
      }
      if (ev.status !== 'ACTIVE') {
        return { status: 'ERROR', success: false, error: `Event '${ev.name}' is not currently active.` };
      }
    }

    // Atomic replace
    this.eventSelections = this.eventSelections.filter(s => s.participantId !== participantId);
    for (const eid of eventIds) {
      const ev = this.events.find(e => e.id === eid || e.slug === eid || e.code === eid)!;
      this.eventSelections.push({
        id: `pes-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        participantId,
        eventId: ev.id,
        selectedAt: new Date().toISOString(),
        selectedBy: coordinatorId || null,
        createdAt: new Date().toISOString()
      });
    }
    this.save();

    return {
      status: 'SUCCESS',
      success: true,
      selectedEvents: this.getParticipantEventSelections(participantId)
    };
  }

  // ------------------------------------------------------------
  // STATISTICS & AGGREGATIONS
  // ------------------------------------------------------------
  public getOverallStats(): OverallStats {
    const totalRegistered = this.participants.length;
    const overallRecords = this.attendance.filter(a => a.attendanceType === 'OVERALL');
    const overallCheckedIn = overallRecords.length;
    const remaining = Math.max(0, totalRegistered - overallCheckedIn);
    const attendancePercentage = totalRegistered > 0 ? Number(((overallCheckedIn / totalRegistered) * 100).toFixed(2)) : 0;

    const recent = overallRecords.slice(0, 10).map(a => this.enrichRecord(a));

    const codeCrusadeEv = this.events.find(e => e.code === 'CODE_CRUSADE');
    const logicArenaEv = this.events.find(e => e.code === 'LOGIC_ARENA');
    const uiuxStudioEv = this.events.find(e => e.code === 'UIUX_STUDIO');
    const techTacticsEv = this.events.find(e => e.code === 'TECH_TACTICS');
    const pixelPulseEv = this.events.find(e => e.code === 'PIXEL_PULSE');

    const eventSelections = {
      codeCrusade: codeCrusadeEv ? this.eventSelections.filter(s => s.eventId === codeCrusadeEv.id).length : 0,
      logicArena: logicArenaEv ? this.eventSelections.filter(s => s.eventId === logicArenaEv.id).length : 0,
      uiuxStudio: uiuxStudioEv ? this.eventSelections.filter(s => s.eventId === uiuxStudioEv.id).length : 0,
      techTactics: techTacticsEv ? this.eventSelections.filter(s => s.eventId === techTacticsEv.id).length : 0,
      pixelPulse: pixelPulseEv ? this.eventSelections.filter(s => s.eventId === pixelPulseEv.id).length : 0
    };

    return {
      totalRegistered,
      overallCheckedIn,
      remaining,
      attendancePercentage,
      todayCount: overallCheckedIn,
      recentCheckins: recent,
      eventSelections
    };
  }

  public getEventStats(eventIdOrSlug: string): EventStats | null {
    const event = getEventById(eventIdOrSlug) || this.events.find(e => e.slug === eventIdOrSlug || e.code === eventIdOrSlug);
    if (!event) return null;

    const totalRegistered = this.participants.length;
    const overallAttendees = this.attendance.filter(a => a.attendanceType === 'OVERALL').length;
    const eventRecords = this.attendance.filter(a => a.attendanceType === 'EVENT' && a.eventId === event.id);
    const eventCheckins = eventRecords.length;
    const remaining = Math.max(0, totalRegistered - eventCheckins);
    const attendancePercentage = totalRegistered > 0 ? Number(((eventCheckins / totalRegistered) * 100).toFixed(2)) : 0;
    const eventAttendanceRate = overallAttendees > 0 ? Number(((eventCheckins / overallAttendees) * 100).toFixed(2)) : 0;

    // Selection metrics
    const selectedParticipants = this.eventSelections.filter(s => s.eventId === event.id).length;
    const selectedNotCheckedIn = Math.max(0, selectedParticipants - eventCheckins);
    const attendancePercentageAmongSelected = selectedParticipants > 0
      ? Number(((eventCheckins / selectedParticipants) * 100).toFixed(2))
      : 0;

    const recent = eventRecords.slice(0, 10).map(a => this.enrichRecord(a));

    return {
      eventId: event.id,
      eventCode: event.code,
      eventSlug: event.slug,
      eventName: event.name,
      totalRegistered,
      overallAttendees,
      eventCheckins,
      selectedParticipants,
      selectedNotCheckedIn,
      remaining,
      attendancePercentage,
      attendancePercentageAmongSelected,
      eventAttendanceRate,
      recentCheckins: recent
    };
  }

  public getClassificationRows(filters: ClassificationFilters): ClassificationRow[] {
    let dataset = [...this.participants];

    // Filter by college
    if (filters.college && filters.college !== 'ALL') {
      dataset = dataset.filter(p => p.college.toLowerCase() === filters.college!.toLowerCase());
    }

    // Filter by department
    if (filters.department && filters.department !== 'ALL') {
      dataset = dataset.filter(p => p.department.toLowerCase() === filters.department!.toLowerCase());
    }

    // Filter by year
    if (filters.year && filters.year !== 'ALL') {
      dataset = dataset.filter(p => p.year.toLowerCase() === filters.year!.toLowerCase());
    }

    // Filter by search string
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      dataset = dataset.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          (p.passId && p.passId.toLowerCase().includes(q)) ||
          p.qrToken.toLowerCase().includes(q) ||
          p.college.toLowerCase().includes(q) ||
          p.department.toLowerCase().includes(q)
      );
    }

    // Filter by eventSelected if specified
    if (filters.eventSelected && filters.eventSelected !== 'ALL') {
      const targetEv = this.events.find(
        e => e.id === filters.eventSelected || e.slug === filters.eventSelected || e.code === filters.eventSelected
      );
      if (targetEv) {
        dataset = dataset.filter(p =>
          this.eventSelections.some(s => s.participantId === p.id && s.eventId === targetEv.id)
        );
      }
    }

    // Determine target attendance records
    let targetEventId: string | undefined;
    if (filters.eventSlug) {
      const e = this.events.find(ev => ev.slug === filters.eventSlug);
      if (e) targetEventId = e.id;
    } else if (filters.eventId) {
      targetEventId = filters.eventId;
    }

    const codeCrusadeEv = this.events.find(e => e.code === 'CODE_CRUSADE');
    const logicArenaEv = this.events.find(e => e.code === 'LOGIC_ARENA');
    const uiuxStudioEv = this.events.find(e => e.code === 'UIUX_STUDIO');
    const techTacticsEv = this.events.find(e => e.code === 'TECH_TACTICS');
    const pixelPulseEv = this.events.find(e => e.code === 'PIXEL_PULSE');

    const rows: ClassificationRow[] = [];

    dataset.forEach(p => {
      // Overall attendance: strictly attendanceType = 'OVERALL' AND status = 'ENTERED'
      const overallAtt = this.attendance.find(
        a => a.participantId === p.id && a.attendanceType === 'OVERALL' && a.status === 'ENTERED'
      );

      // Event attendance: strictly attendanceType = 'EVENT' AND eventId = targetEventId AND status = 'ENTERED'
      const targetEventAtt = targetEventId
        ? this.attendance.find(
            a => a.participantId === p.id && a.attendanceType === 'EVENT' && a.eventId === targetEventId && a.status === 'ENTERED'
          )
        : undefined;

      // Authoritative definition of ENTERED
      const isEntered = targetEventId
        ? Boolean(targetEventAtt)
        : Boolean(overallAtt);

      // Status filtering:
      // When user chooses "Entered Participants", only entered participants are included.
      if (filters.status === 'ENTERED' && !isEntered) return;
      if (filters.status === 'NOT_ENTERED' && isEntered) return;

      // Check coordinator filter
      const relevantAtt = targetEventId ? targetEventAtt : overallAtt;
      if (filters.coordinatorId && filters.coordinatorId !== 'ALL') {
        if (!relevantAtt || relevantAtt.coordinatorId !== filters.coordinatorId) return;
      }

      const coord = relevantAtt?.coordinatorId
        ? this.coordinators.find(c => c.id === relevantAtt.coordinatorId)
        : undefined;

      const ev = relevantAtt?.eventId
        ? this.events.find(e => e.id === relevantAtt.eventId)
        : undefined;

      // Selections
      const hasCC = codeCrusadeEv && this.eventSelections.some(s => s.participantId === p.id && s.eventId === codeCrusadeEv.id);
      const hasLA = logicArenaEv && this.eventSelections.some(s => s.participantId === p.id && s.eventId === logicArenaEv.id);
      const hasUI = uiuxStudioEv && this.eventSelections.some(s => s.participantId === p.id && s.eventId === uiuxStudioEv.id);
      const hasTT = techTacticsEv && this.eventSelections.some(s => s.participantId === p.id && s.eventId === techTacticsEv.id);
      const hasPP = pixelPulseEv && this.eventSelections.some(s => s.participantId === p.id && s.eventId === pixelPulseEv.id);

      // Event Check-ins
      const ccAtt = codeCrusadeEv ? this.attendance.find(a => a.participantId === p.id && a.attendanceType === 'EVENT' && a.eventId === codeCrusadeEv.id && a.status === 'ENTERED') : undefined;
      const laAtt = logicArenaEv ? this.attendance.find(a => a.participantId === p.id && a.attendanceType === 'EVENT' && a.eventId === logicArenaEv.id && a.status === 'ENTERED') : undefined;
      const uiAtt = uiuxStudioEv ? this.attendance.find(a => a.participantId === p.id && a.attendanceType === 'EVENT' && a.eventId === uiuxStudioEv.id && a.status === 'ENTERED') : undefined;
      const ttAtt = techTacticsEv ? this.attendance.find(a => a.participantId === p.id && a.attendanceType === 'EVENT' && a.eventId === techTacticsEv.id && a.status === 'ENTERED') : undefined;
      const ppAtt = pixelPulseEv ? this.attendance.find(a => a.participantId === p.id && a.attendanceType === 'EVENT' && a.eventId === pixelPulseEv.id && a.status === 'ENTERED') : undefined;

      rows.push({
        index: rows.length + 1,
        passId: p.passId || 'UNISSUED',
        name: p.name,
        email: p.email,
        phone: p.phone,
        college: p.college,
        department: p.department,
        year: p.year,
        checkinTime: relevantAtt?.checkinTime || '',
        formattedTime: relevantAtt?.checkinTime ? formatTime(relevantAtt.checkinTime) : 'Not Entered',
        coordinatorName: coord ? coord.name : relevantAtt ? 'Desk' : '-',
        status: isEntered ? 'ENTERED' : 'NOT ENTERED',
        eventName: ev ? ev.name : targetEventId ? 'Event Entry' : 'Overall Entry',
        attendanceType: relevantAtt?.attendanceType || (targetEventId ? 'EVENT' : 'OVERALL'),

        codeCrusadeSelected: hasCC ? 'YES' : 'NO',
        logicArenaSelected: hasLA ? 'YES' : 'NO',
        uiuxStudioSelected: hasUI ? 'YES' : 'NO',
        techTacticsSelected: hasTT ? 'YES' : 'NO',
        pixelPulseSelected: hasPP ? 'YES' : 'NO',

        codeCrusadeCheckin: ccAtt?.checkinTime ? formatTime(ccAtt.checkinTime) : 'NOT CHECKED IN',
        logicArenaCheckin: laAtt?.checkinTime ? formatTime(laAtt.checkinTime) : 'NOT CHECKED IN',
        uiuxStudioCheckin: uiAtt?.checkinTime ? formatTime(uiAtt.checkinTime) : 'NOT CHECKED IN',
        techTacticsCheckin: ttAtt?.checkinTime ? formatTime(ttAtt.checkinTime) : 'NOT CHECKED IN',
        pixelPulseCheckin: ppAtt?.checkinTime ? formatTime(ppAtt.checkinTime) : 'NOT CHECKED IN'
      });
    });

    return rows;
  }

  public getCollegeBreakdown(): CollegeBreakdownRow[] {
    const collegeMap = new Map<string, CollegeBreakdownRow>();

    // Initialize colleges
    this.participants.forEach(p => {
      if (!collegeMap.has(p.college)) {
        collegeMap.set(p.college, {
          college: p.college,
          totalParticipants: 0,
          overallAttendance: 0,
          codeCrusade: 0,
          logicArena: 0,
          uiuxStudio: 0,
          techTactics: 0,
          pixelPulse: 0
        });
      }
      collegeMap.get(p.college)!.totalParticipants++;
    });

    // Populate attendances
    this.attendance.forEach(a => {
      const p = this.findParticipantById(a.participantId);
      if (!p || !collegeMap.has(p.college)) return;
      const row = collegeMap.get(p.college)!;

      if (a.attendanceType === 'OVERALL') {
        row.overallAttendance++;
      } else if (a.attendanceType === 'EVENT' && a.eventId) {
        const ev = getEventById(a.eventId);
        if (ev?.code === 'CODE_CRUSADE') row.codeCrusade++;
        else if (ev?.code === 'LOGIC_ARENA') row.logicArena++;
        else if (ev?.code === 'UIUX_STUDIO') row.uiuxStudio++;
        else if (ev?.code === 'TECH_TACTICS') row.techTactics++;
        else if (ev?.code === 'PIXEL_PULSE') row.pixelPulse++;
      }
    });

    return Array.from(collegeMap.values()).sort((a, b) => b.totalParticipants - a.totalParticipants);
  }

  public getDepartmentBreakdown(): DepartmentBreakdownRow[] {
    const keyMap = new Map<string, DepartmentBreakdownRow>();

    this.participants.forEach(p => {
      const key = `${p.college}||${p.department}||${p.year}`;
      if (!keyMap.has(key)) {
        keyMap.set(key, {
          college: p.college,
          department: p.department,
          year: p.year,
          totalParticipants: 0,
          overallAttendance: 0,
          codeCrusade: 0,
          logicArena: 0,
          uiuxStudio: 0,
          techTactics: 0,
          pixelPulse: 0
        });
      }
      keyMap.get(key)!.totalParticipants++;
    });

    this.attendance.forEach(a => {
      const p = this.findParticipantById(a.participantId);
      if (!p) return;
      const key = `${p.college}||${p.department}||${p.year}`;
      const row = keyMap.get(key);
      if (!row) return;

      if (a.attendanceType === 'OVERALL') {
        row.overallAttendance++;
      } else if (a.attendanceType === 'EVENT' && a.eventId) {
        const ev = getEventById(a.eventId);
        if (ev?.code === 'CODE_CRUSADE') row.codeCrusade++;
        else if (ev?.code === 'LOGIC_ARENA') row.logicArena++;
        else if (ev?.code === 'UIUX_STUDIO') row.uiuxStudio++;
        else if (ev?.code === 'TECH_TACTICS') row.techTactics++;
        else if (ev?.code === 'PIXEL_PULSE') row.pixelPulse++;
      }
    });

    return Array.from(keyMap.values()).sort((a, b) => b.totalParticipants - a.totalParticipants);
  }

  public resetDemoData(): void {
    this.participants = [...SEED_PARTICIPANTS];
    this.attendance = [];
    this.eventSelections = [];
    this.save();
  }

  public resetScanData(): void {
    this.attendance = [];
    this.eventSelections = [];
    this.save();
  }

  public syncLiveState(participants?: Participant[], attendance?: AttendanceRecord[], eventSelections?: ParticipantEventSelection[]): void {
    if (participants && participants.length > 0) {
      this.participants = participants;
    }
    if (attendance !== undefined) {
      this.attendance = attendance;
    }
    if (eventSelections !== undefined) {
      this.eventSelections = eventSelections;
    }
    this.save();
  }

  private enrichRecord(record: AttendanceRecord): AttendanceRecord {
    const p = this.findParticipantById(record.participantId);
    const coord = record.coordinatorId ? this.coordinators.find(c => c.id === record.coordinatorId) : undefined;
    const ev = record.eventId ? this.events.find(e => e.id === record.eventId) : undefined;

    return {
      ...record,
      participantName: p?.name,
      passId: p?.passId,
      college: p?.college,
      department: p?.department,
      year: p?.year,
      coordinatorName: coord?.name,
      eventName: ev?.name,
      eventCode: ev?.code
    };
  }
}

export const mockDatabase = new MockRelationalDatabase();
