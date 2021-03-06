import React, { Suspense } from 'react';
import router from 'umi/router';
import { Layout } from 'antd';
import TagView from '@/components/TagView';
import DocumentTitle from 'react-document-title';
import isEqual from 'lodash/isEqual';
import memoizeOne from 'memoize-one';
import { connect } from 'dva';
import { ContainerQuery } from 'react-container-query';
import classNames from 'classnames';
import pathToRegexp from 'path-to-regexp';
import Media from 'react-media';
import { formatMessage } from 'umi/locale';
import PageLoading from '@/components/PageLoading';
import SiderMenu from '@/components/SiderMenu';
import logo from '../assets/logo.svg';
import Footer from './Footer';
import Header from './Header';
import Context from './MenuContext';
import Exception403 from '../pages/Exception/403';
import styles from './BasicLayout.less';

// lazy load SettingDrawer
const SettingDrawer = React.lazy(() => import('@/components/SettingDrawer'));

const { Content } = Layout;

const query = {
  'screen-xs': {
    maxWidth: 575,
  },
  'screen-sm': {
    minWidth: 576,
    maxWidth: 767,
  },
  'screen-md': {
    minWidth: 768,
    maxWidth: 991,
  },
  'screen-lg': {
    minWidth: 992,
    maxWidth: 1199,
  },
  'screen-xl': {
    minWidth: 1200,
    maxWidth: 1599,
  },
  'screen-xxl': {
    minWidth: 1600,
  },
};

class BasicLayout extends React.PureComponent {
  constructor(props) {
    super(props);

    const routeKey = '/dashboard/analysis';
    const tabList = []; 
    const tabListArr = [];

    // 获取所有已存在key值
    this.state = ({
        tabList,
        tabListKey:[routeKey],
        activeKey:routeKey,
        tabListArr,
        routeKey
    })

    this.getPageTitle = memoizeOne(this.getPageTitle);
    this.matchParamsPath = memoizeOne(this.matchParamsPath, isEqual);
  }

  componentDidMount() {
    router.push({ pathname : '/' })
    const {
      dispatch,
      route: { routes, authority },
    } = this.props;
    dispatch({
      type: 'user/fetchCurrent',
    });
    dispatch({
      type: 'setting/getSetting',
    });
    dispatch({
      type: 'menu/getMenuData',
      payload: { routes, authority },
    });
  }

  componentWillReceiveProps(nextProps) {
    const { prevPathname } = this.props;
    if (nextProps.history.action === "POP" && prevPathname !== nextProps.location.pathname) {
      this.onHandlePage({ key: nextProps.location.pathname })
    }
  }

  componentDidUpdate(preProps) {
    // After changing to phone mode,
    // if collapsed is true, you need to click twice to display
    const { collapsed, isMobile } = this.props;
    if (isMobile && !preProps.isMobile && !collapsed) {
      this.handleMenuCollapse(false);
    }
  }

  getContext() {
    const { location, breadcrumbNameMap } = this.props;
    return {
      location,
      breadcrumbNameMap,
    };
  }

  matchParamsPath = (pathname, breadcrumbNameMap) => {
    const pathKey = Object.keys(breadcrumbNameMap).find(key => pathToRegexp(key).test(pathname));
    return breadcrumbNameMap[pathKey];
  };

  getRouterAuthority = (pathname, routeData) => {
    let routeAuthority = ['noAuthority'];
    const getAuthority = (key, routes) => {
      routes.map(route => {
        if (route.path && pathToRegexp(route.path).test(key)) {
          routeAuthority = route.authority;
        } else if (route.routes) {
          routeAuthority = getAuthority(key, route.routes);
        }
        return route;
      });
      return routeAuthority;
    };
    return getAuthority(pathname, routeData);
  };

  getPageTitle = (pathname, breadcrumbNameMap) => {
    const currRouterData = this.matchParamsPath(pathname, breadcrumbNameMap);

    if (!currRouterData) {
      return 'Ant Tabs';
    }
    const pageName = formatMessage({
      id: currRouterData.locale || currRouterData.name,
      defaultMessage: currRouterData.name,
    });

    return `${pageName} - Ant Tabs`;
  };

  getLayoutStyle = () => {
    const { fixSiderbar, isMobile, collapsed, layout } = this.props;
    if (fixSiderbar && layout !== 'topmenu' && !isMobile) {
      return {
        paddingLeft: collapsed ? '80px' : '256px',
      };
    }
    return null;
  };

  handleMenuCollapse = collapsed => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/changeLayoutCollapsed',
      payload: collapsed,
    });
  };

  renderSettingDrawer = () => {
    // Do not render SettingDrawer in production
    // unless it is deployed in preview.pro.ant.design as demo
    if (process.env.NODE_ENV === 'production' && APP_TYPE !== 'site') {
      return null;
    }
    return <SettingDrawer />;
  };

  updateTree = data => {
    const treeData = data;
    const treeList = [];

    // 递归获取树列表
    const getTreeList = subTreedata => {
      subTreedata.forEach(node => {
        if(!node.level){
          treeList.push({ tab: node.name, key: node.path,locale:node.locale,closable:true,content:node.component });
        }
        if (node.routes && node.routes.length > 0) { //! node.hideChildrenInMenu &&
          getTreeList(node.routes);
        }
      });
    };
    getTreeList(treeData);
    return treeList;
  };

  onHandlePage = (e) => {
    const { menuData } = this.props;
    let { key } = e;
    const { search = '' } = e;
    const tabLists = this.updateTreeList(menuData);
    const { tabListKey,tabList,tabListArr } = this.state;
    if(tabListArr.includes(key)) {
      if(!search) {
        router.replace(key)
      }else{
        router.replace({pathname:key, search})
      }
    }else{
      key = '/exception/404'
      router.replace('/exception/404')
    }

    // 设置当前选择的key
    this.setState({
      activeKey:key
    })

    tabLists.forEach((v) => {
      if(v.key === key) {
        if(tabList.length === 0) {
          v.closable = false
          this.setState({
            tabList:[...tabList,v]
          })
        }else if(!tabListKey.includes(v.key)) {
          this.setState({
            tabList:[...tabList,v],
            tabListKey:[...tabListKey,v.key]
          })
        }
      }
    })
  }

  updateTreeList = data => {
    const treeData = data;
    const treeList = [];

    // 递归获取树列表
    const getTreeList = subTreedata => {
      subTreedata.forEach(node => {
        if(!node.level) {
          treeList.push({ tab: node.name, key: node.path,locale:node.locale,closable:true,content:node.component });
        }
        if (node.children && node.children.length > 0) {
          getTreeList(node.children);
        }
      });
    };
    
    getTreeList(treeData);
    return treeList;
  }

  handleSetTagValue = (data) => {
    this.setState(data)
  }

  render() {
    const {
      navTheme,
      layout: PropsLayout,
      location: { pathname,search },
      isMobile,
      menuData,
      breadcrumbNameMap,
      route: { routes },
      fixedHeader
    } = this.props;
    let { activeKey } = this.state;
    const { routeKey, tabList,tabListArr,tabListKey } = this.state;
    if(pathname === '/'){
      activeKey = routeKey
    }
    const isTop = PropsLayout === 'topmenu';
    const routerConfig = this.getRouterAuthority(pathname+search, routes);
    const contentStyle = !fixedHeader ? { paddingTop: 0 } : {};
    const layout = (
      <Layout>
        {isTop && !isMobile ? null : (
          <SiderMenu
            logo={logo}
            theme={navTheme}
            onCollapse={this.handleMenuCollapse}
            menuData={menuData}
            isMobile={isMobile}
            {...this.props}
            onHandlePage={this.onHandlePage}
          />
        )}
        <Layout
          style={{
            ...this.getLayoutStyle(),
            minHeight: '100vh',
          }}
        >
          <Header
            menuData={menuData}
            handleMenuCollapse={this.handleMenuCollapse}
            logo={logo}
            isMobile={isMobile}
            {...this.props}
          />
          <Content className={styles.content} style={contentStyle}>
            <TagView routes={routes} activeKey={activeKey} routeKey={routeKey} tabList={tabList} tabListArr={tabListArr} tabListKey={tabListKey} handleSetTagValue={this.handleSetTagValue} authority={routerConfig} noMatch={<Exception403 />} />
          </Content>
          <Footer />
        </Layout>
      </Layout>
    );
    return (
      <React.Fragment>
        <DocumentTitle title={this.getPageTitle(pathname, breadcrumbNameMap)}>
          <ContainerQuery query={query}>
            {params => (
              <Context.Provider value={this.getContext()}>
                <div className={classNames(params)}>{layout}</div>
              </Context.Provider>
            )}
          </ContainerQuery>
        </DocumentTitle>
        <Suspense fallback={<PageLoading />}>{this.renderSettingDrawer()}</Suspense>
      </React.Fragment>
    );
  }
}

export default connect(({ global, setting, menu }) => ({
  collapsed: global.collapsed,
  layout: setting.layout,
  menuData: menu.menuData,
  breadcrumbNameMap: menu.breadcrumbNameMap,
  ...setting,
}))(props => (
  <Media query="(max-width: 599px)">
    {isMobile => <BasicLayout {...props} isMobile={isMobile} />}
  </Media>
));
