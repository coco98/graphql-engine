import React from 'react';
import Common from '../Common/Common';

import { addResolver, RESET } from './addResolverReducer';

class Add extends React.Component {
  componentWillUnmount() {
    this.props.dispatch({ type: RESET });
  }
  render() {
    const styles = require('../Styles.scss');
    const { isRequesting, dispatch } = this.props;
    return (
      <div className={styles.addWrapper}>
        <div className={styles.heading_text}>Stitch a new GraphQL schema</div>
        <Common {...this.props} />
        <div className={styles.commonBtn}>
          <button
            className={styles.yellow_button}
            onClick={() => dispatch(addResolver())}
            disabled={isRequesting}
          >
            {isRequesting ? 'Creating...' : 'Stitch Schema'}
          </button>
          <button className={styles.default_button}>Cancel</button>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    ...state.customResolverData.addData,
    ...state.customResolverData.headerData,
  };
};

export default connect => connect(mapStateToProps)(Add);
