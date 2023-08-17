import React from "react";

import { Button } from "antd";

export default class HomePage extends React.PureComponent {
  goToPage(pathname) {
    this.props.history.push({ pathname });
  }

  goToAboutPage = () => {
    this.goToPage("/about");
  };

  goToListPage = () => {
    this.goToPage("/list");
  };

  goOtherApp = () => {
    window.history.pushState(
      { name: "trade-index" },
      "trade-index",
      "#/trade/"
    );
    // 主动触发一次popstate事件
    window.dispatchEvent(new PopStateEvent("popstate"));
  };
  render() {
    return (
      <div style={styles.container}>
        <h1 style={styles.titleText}>This is Order</h1>
        <div style={styles.btnGroup}>
          <Button type={"primary"} onClick={this.goToAboutPage}>
            Go to AboutPage
          </Button>
          <Button type={"primary"} onClick={this.goToListPage}>
            Go to ListPage
          </Button>
        </div>
        <div style={styles.btnGroup}>
          <Button type={"danger"} onClick={this.goOtherApp}>
            Go to trade App
          </Button>
        </div>
      </div>
    );
  }
}

const styles = {
  container: {
    // position: 'absolute',
    // left: 0,
    // top: 0,
    width: "100vw",
    height: "100vh",
    padding: "0 20px",
    backgroundColor: "#F4C272",
  },
  titleText: {
    paddingTop: 20,
    textAlign: "center",
  },
  btnGroup: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
};