import React from 'react';
import Common from '../Common/Common';

import {
  fetchResolver,
  deleteResolver,
  modifyResolver,
  RESET,
  TOGGLE_MODIFY,
} from '../Add/addResolverReducer';
import { VIEW_RESOLVER } from '../customActions';
import { push } from 'react-router-redux';
import Helmet from 'react-helmet';
import tabInfo from './tabInfo';
import CommonTabLayout from '../../Layout/CommonTabLayout/CommonTabLayout';

import { appPrefix, pageTitle } from '../constants';

class Edit extends React.Component {
  constructor() {
    super();
    this.editClicked = this.editClicked.bind(this);
    this.modifyClick = this.modifyClick.bind(this);
    this.handleDeleteResolver = this.handleDeleteResolver.bind(this);
    this.handleCancelModify = this.handleCancelModify.bind(this);
  }
  componentDidMount() {
    const { resolverName } = this.props.params;
    if (!resolverName) {
      this.props.dispatch(push('/custom-resolver'));
    }
    Promise.all([
      this.props.dispatch(fetchResolver(resolverName)),
      this.props.dispatch({ type: VIEW_RESOLVER, data: resolverName }),
    ]);
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.params.resolverName !== this.props.params.resolverName) {
      Promise.all([
        this.props.dispatch(fetchResolver(nextProps.params.resolverName)),
        this.props.dispatch({
          type: VIEW_RESOLVER,
          data: nextProps.params.resolverName,
        }),
      ]);
    }
  }
  componentWillUnmount() {
    Promise.all([
      this.props.dispatch({ type: RESET }),
      this.props.dispatch({ type: VIEW_RESOLVER, data: '' }),
    ]);
  }

  handleDeleteResolver(e) {
    e.preventDefault();
    const a = prompt(
      'Are you absolutely sure?\nThis action cannot be undone. This will permanently delete stitched GraphQL schema. Please type "DELETE" (in caps, without quotes) to confirm.\n '
    );
    try {
      if (a && typeof a === 'string' && a.trim() === 'DELETE') {
        this.props.dispatch(deleteResolver());
      } else {
        // Input didn't match
      }
    } catch (err) {
      console.error(err);
    }
  }
  modifyClick() {
    this.props.dispatch({ type: TOGGLE_MODIFY });
  }
  handleCancelModify() {
    this.props.dispatch({ type: TOGGLE_MODIFY });
  }
  editClicked() {
    this.props.dispatch(modifyResolver());
  }
  render() {
    const styles = require('../Styles.scss');
    const { isRequesting, editState, migrationMode } = this.props;
    const { resolverName } = this.props.params;

    const generateMigrateBtns = () => {
      return 'isModify' in editState && !editState.isModify ? (
        <div className={styles.commonBtn}>
          <button
            className={styles.yellow_button}
            onClick={e => {
              e.preventDefault();
              this.modifyClick();
            }}
            data-test={'remote-schema-edit-modify-btn'}
          >
            Modify
          </button>
          <button
            className={styles.danger_button + ' btn-danger'}
            onClick={e => {
              e.preventDefault();
              this.handleDeleteResolver(e);
            }}
            disabled={isRequesting}
            data-test={'remote-schema-edit-delete-btn'}
          >
            {isRequesting ? 'Deleting ...' : 'Delete'}
          </button>
        </div>
      ) : (
        <div className={styles.commonBtn}>
          <button
            className={styles.yellow_button}
            type="submit"
            disabled={isRequesting}
            data-test={'remote-schema-edit-save-btn'}
          >
            {isRequesting ? 'Saving' : 'Save'}
          </button>
          <button
            className={styles.default_button}
            onClick={e => {
              e.preventDefault();
              this.handleCancelModify();
            }}
            data-test={'remote-schema-edit-cancel-btn'}
          >
            Cancel
          </button>
        </div>
      );
    };

    const breadCrumbs = [
      {
        title: 'Remote schemas',
        url: appPrefix,
      },
      {
        title: 'Manage',
        url: appPrefix + '/' + 'manage',
      },
    ];

    if (resolverName) {
      breadCrumbs.push({
        title: resolverName.trim(),
        url:
          appPrefix +
          '/' +
          'manage' +
          '/' +
          resolverName.trim() +
          '/' +
          'details',
      });
      breadCrumbs.push({
        title: 'modify',
        url: '',
      });
    }

    return (
      <div className={styles.addWrapper}>
        <Helmet
          title={`Edit ${pageTitle} - ${resolverName} - ${pageTitle}s | Hasura`}
        />
        <CommonTabLayout
          appPrefix={appPrefix}
          currentTab="modify"
          heading={resolverName}
          tabsInfo={tabInfo}
          breadCrumbs={breadCrumbs}
          baseUrl={`${appPrefix}/manage/${resolverName}`}
        />
        <form
          onSubmit={e => {
            e.preventDefault();
            this.editClicked();
          }}
        >
          <Common {...this.props} />
          {migrationMode ? generateMigrateBtns() : null}
        </form>
      </div>
    );
  }
}
const mapStateToProps = state => {
  return {
    ...state.customResolverData.addData,
    ...state.customResolverData.headerData,
    migrationMode: state.main.migrationMode,
    dataHeaders: { ...state.tables.dataHeaders },
  };
};

export default connect => connect(mapStateToProps)(Edit);
