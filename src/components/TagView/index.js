import React, { PureComponent } from 'react';
import router from 'umi/router';
import { Route } from 'react-router-dom';
import Authorized from '@/utils/Authorized';
import { Tabs, Dropdown, Menu, Icon } from 'antd';
import styles from './index.less';

class TagView extends PureComponent {
  constructor(props) {
    super(props);
    const { routes, tabList, tabListArr } = props;
    const routeKey = '/dashboard/analysis';
    const tabName = '分析页';
    const tabLists = this.updateTree(routes);

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
  }

  handleTagChange = key => {
    const { handleSetTagValue } = this.props;
    handleSetTagValue({ activeKey: key })
    router.replace(key)
  }

  handleTagClick = key => {
    const { handleSetTagValue } = this.props;
    handleSetTagValue({ activeKey: key })
    router.replace(key)
  }

  handleTagEdit = (targetKey, action) => {
    if (action === 'remove') {
      this.handleTagRemove(targetKey);
    }
  }

  handleTagRemove = (targetKey) => {
    let { activeKey } = this.props;
    const { tabList, handleSetTagValue } = this.props;
    let lastIndex;
    
    tabList.forEach((pane, i) => {
      if (pane.key === targetKey) {
        lastIndex = i - 1;
      }
    });

    const newTabList = []; 
    const newTabListKey = [];
    tabList.forEach(pane => {
      if(pane.key !== targetKey){
        newTabList.push(pane)
        newTabListKey.push(pane.key)
      }
    });

    if (lastIndex >= 0 && activeKey === targetKey) {
      activeKey = newTabList[lastIndex].key;
    }

    router.replace(activeKey)

    handleSetTagValue({ tabList: newTabList, activeKey, tabListKey: newTabListKey });
  }

  handelMenuClick = e => {
    const { key } = e;
    let { tabList, tabListKey } = this.props;
    const { activeKey, routeKey, handleSetTagValue } = this.props;

    if (key === '1') {
      tabList = tabList.filter((v) => v.key !== activeKey || v.key === routeKey)
      tabListKey = tabListKey.filter((v) => v !== activeKey || v === routeKey)
      handleSetTagValue({
        activeKey: routeKey,
        tabList,
        tabListKey
      });
    } else if (key === '2') {
      tabList = tabList.filter((v) => v.key === activeKey || v.key === routeKey)
      tabListKey = tabListKey.filter((v) => v === activeKey || v === routeKey)
      handleSetTagValue({
        activeKey: routeKey,
        tabList,
        tabListKey
      });
    } else if (key === '3') {
      tabList = tabList.filter((v) => v.key === routeKey)
      tabListKey = tabListKey.filter((v) => v === routeKey)
      handleSetTagValue({
        activeKey: routeKey,
        tabList,
        tabListKey
      });
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
    const { authority, noMatch, activeKey, tabList} = this.props;

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
          {tabList.map(item => (
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