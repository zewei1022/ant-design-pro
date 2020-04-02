import React, { PureComponent } from 'react';
import router from 'umi/router';
import { Route } from 'react-router-dom';
import Authorized from '@/utils/Authorized';
import { Tabs, Dropdown, Menu, Icon } from 'antd';
import styles from './index.less';

class TagView extends PureComponent {
  constructor(props) {
    super(props);
    const { routes } = props.route;
    const routeKey = '/dashboard/analysis';
    const tabName = '分析页';
    const tabLists = this.updateTree(routes);
    const tabList = [];
    const tabListArr = [];

    tabLists.forEach((v) => {
      if (v.key === routeKey) {
        if (tabList.length === 0) {
          v.closable = false
          v.tab = tabName
          tabList.push(v);
        }
      }
      if (v.key) {
        tabListArr.push(v.key)
      }
    });

    // 获取所有已存在key值
    this.state = ({
      tabList,
      tabListKey: [routeKey],
      activeKey: routeKey,
      tabListArr,
      routeKey
    })
  }

  handleTagChange = key => {
    this.setState({ activeKey: key });
    router.replace(key)
  }

  handleTagClick = key => {
    this.setState({ activeKey: key });
    router.replace(key)
  }

  handleTagEdit = (targetKey, action) => {
    this[action](targetKey);
  }

  handelMenuClick = e => {
    const { key } = e;
    let { tabList, tabListKey } = this.state;
    const { activeKey, routeKey } = this.state;
    if (key === '1') {
      tabList = tabList.filter((v) => v.key !== activeKey || v.key === routeKey)
      tabListKey = tabListKey.filter((v) => v !== activeKey || v === routeKey)
      this.setState({
        activeKey: routeKey,
        tabList,
        tabListKey
      })
    } else if (key === '2') {
      tabList = tabList.filter((v) => v.key === activeKey || v.key === routeKey)
      tabListKey = tabListKey.filter((v) => v === activeKey || v === routeKey)
      this.setState({
        activeKey,
        tabList,
        tabListKey
      })
    } else if (key === '3') {
      tabList = tabList.filter((v) => v.key === routeKey)
      tabListKey = tabListKey.filter((v) => v === routeKey)
      this.setState({
        activeKey: routeKey,
        tabList,
        tabListKey
      })
    }
  }
  
  updateTree = data => {
    const treeData = data;
    const treeList = [];

    const getTreeList = subTreedata => {
      subTreedata.forEach(node => {
        if (!node.level) {
          treeList.push({ tab: node.name, key: node.path, locale: node.locale, closable: true, content: node.component });
        }
        if (node.routes && node.routes.length > 0) {
          getTreeList(node.routes);
        }
      });
    };
    getTreeList(treeData);
    return treeList;
  }

  render() {
    const { TabPane } = Tabs;
    const { authority, noMatch } = this.props;

    const menu = (
      <Menu onClick={this.handelMenuClick}>
        <Menu.Item key="1">关闭当前标签页</Menu.Item>
        <Menu.Item key="2">关闭其他标签页</Menu.Item>
        <Menu.Item key="3">关闭全部标签页</Menu.Item>
      </Menu>
    );
    const operations = (
      <Dropdown overlay={menu}>
        <a className="ant-dropdown-link" href="#">
          Hover me<Icon type="down" />
        </a>
      </Dropdown>
    );
    const renderTabBar = (DefaultTabBarProps, DefaultTabBar) => {
      const tabInfo = [];
      DefaultTabBarProps.panels.forEach(item => {
        tabInfo.push({
          key: item.key,
          title: item.props.tab
        })
      });

      return (
        <Dropdown overlay={menu} trigger={['contextMenu']}>
          <div style={{ display: 'flex', marginBottom: 16 }}>
            {
              tabInfo.map((item, index) => {
                <div key={item.key} onClick={this.handleTagClick} className={props.activeKey === item.key ? 'activeTab' : 'normalTab'}>
                  <div style={{ padding: '0 16px' }}>{item.title}</div>
                </div>
              })
            }
          </div>
        </Dropdown>
      );
    }

    return (
      <div className={styles.tagView}>
        <Tabs
          activeKey={activeKey}
          onChange={this.handleTagChange}
          tabBarExtraContent={operations}
          tabBarStyle={{ background: '#fff' }}
          tabPosition="top"
          tabBarGutter={-1}
          hideAdd
          type="editable-card"
          onEdit={this.handleTagEdit}
        >
          {this.state.tabList.map(item => (
            <TabPane tab={item.tab} key={item.key} closable={item.closable}>
              <Authorized authority={authority} noMatch={noMatch}>
                <Route key={item.key} path={item.path} component={item.content} exact={item.exact} />
              </Authorized>
            </TabPane>
          ))}
        </Tabs>
      </div>
    );
  }
}

export default TagView;