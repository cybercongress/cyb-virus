import Overview from '../pages/Cabinet/Overview/Overview';
import Cabinet from '../pages/Cabinet/Cabinet';
import CyberDCabinet from '../pages/Cabinet/CyberDCabinet/CyberDCabinet';
import Login from '../pages/Cabinet/Login/Login';
import NewWallet from '../pages/NewWallet/NewWallet';
import Welcome from '../pages/NewWallet/Welcome/Welcome';
import ChooseMethod from '../pages/NewWallet/ChooseMethod/ChooseMethod';
import CreateWallet from '../pages/NewWallet/CreateWallet/CreateWallet';
import ImportWallet from '../pages/NewWallet/ImportWallet/ImportWallet';
import ImportAccount from '../pages/Cabinet/CyberDCabinet/ImportAccount/ImportAccount';
import SaveAndLinkContent from '../pages/Cabinet/CyberDCabinet/SaveAndLinkContent/SaveAndLinkContent';
import Search from '../pages/Cabinet/CyberDCabinet/Search/Search';
import SavedContent from '../pages/Cabinet/IpfsCabinet/SavedContent/SavedContent';
import Settings from '../pages/Cabinet/Settings/Settings';
import LinkContent from '../pages/Cabinet/CyberDCabinet/LinkContent/LinkContent';
import Backup from '../pages/Cabinet/Backup/Backup';
import AskRestoreBackup from '../pages/NewWallet/AskRestoreBackup/AskRestoreBackup';
import LogIn from '../pages/NewWallet/LogIn/LogIn';
import TransferCyb from '../pages/Cabinet/CyberDCabinet/TransferCyb/TransferCyb';

export default [
  {
    path: '',
    component: Cabinet,
    children: [
      {
        path: '',
        name: 'cabinet-overview',
        component: Overview,
      },
      {
        path: '/login',
        name: 'cabinet-login',
        component: Login,
      },
      {
        path: '/cyberd',
        name: 'cabinet-cyberd',
        component: CyberDCabinet,
      },
      {
        path: '/cyberd/import',
        name: 'cabinet-cyberd-import',
        component: ImportAccount,
      },
      {
        path: '/cyberd/link',
        name: 'cabinet-cyberd-link',
        component: LinkContent,
      },
      {
        path: '/cyberd/transfer',
        name: 'cabinet-cyberd-transfer',
        component: TransferCyb,
      },
      {
        path: '/cyberd/save-and-link',
        name: 'cabinet-cyberd-save-and-link',
        component: SaveAndLinkContent,
      },
      {
        path: '/cyberd/search',
        name: 'cabinet-cyberd-search',
        component: Search,
      },
      {
        path: '/ipfs/saved-content',
        name: 'cabinet-ipfs-saved-content',
        component: SavedContent,
      },
      {
        path: '/settings',
        name: 'cabinet-settings',
        component: Settings,
      },
      {
        path: '/backup',
        name: 'cabinet-backup',
        component: Backup,
      },
    ],
  },
  {
    path: '/new-wallet',
    component: NewWallet,
    children: [
      {
        path: 'welcome',
        name: 'new-wallet-welcome',
        component: Welcome,
      },
      {
        path: 'login',
        name: 'login',
        component: LogIn,
      },
      {
        path: 'restore-backup',
        name: 'ask-restore-backup',
        component: AskRestoreBackup,
      },
      {
        path: 'choose-method',
        name: 'new-wallet-method',
        component: ChooseMethod,
      },
      {
        path: 'create-wallet',
        name: 'new-wallet-create',
        component: CreateWallet,
      },
      {
        path: 'import-wallet',
        name: 'new-wallet-import',
        component: ImportWallet,
      },
    ],
  },
  {
    path: '*',
    redirect: '',
  },
];
