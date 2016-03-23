'use strict';

import React, { Children, Component, PropTypes, cloneElement } from 'react';
import classnames from 'classnames';
import { forEach, deepEqual } from './utils/objects';
import clone from './utils/clone';
import { getGrid } from './utils/grids';
import FormControl from './FormControl';
import FormSubmit from './FormSubmit';
import { fetchEnhance, FETCH_SUCCESS } from './higherOrders/Fetch';
import { getLang } from './lang';

import { requireCss } from './themes';
requireCss('form');

class Form extends Component {
  constructor (props) {
    super(props);
    this.state = {
      data: props.data
    };

    this.handleSubmit = this.handleSubmit.bind(this);
    this.submit = this.submit.bind(this);

    // don't need state
    this.items = {};
    this.names = {};
    this.validationPools = {};

    this.itemBind = (item) => {
      this.items[item.id] =item;
      this.names[item.name] = item.id;

      let data = this.state.data;
      data[item.name] = item.value;
      this.setState({ data });

      // bind triger item
      if (item.valiBind) {
        item.valiBind.forEach((vb) => {
          this.validationPools[vb] = (this.validationPools[vb] || []).concat(item.validate);
        });
      }
    };

    this.itemUnbind = (id, name) => {
      delete this.items[id];

      // if id is matched name, remove data
      if (this.names[name] === id) {
        let data = this.state.data;
        delete data[name];
        this.setState({ data });

        // remove valiBind
        delete this.validationPools[name];
      }
    };

    this.itemChange = (id, value, err) => {
      let data = this.state.data;
      const name = this.items[id].name;

      // don't use merge or immutablejs
      //data = merge({}, data, {[name]: value});

      if (data[name] !== value) {
        data[name] = value;
        // setState only triger render, data was changed
        this.setState({ data });
      }

      let valiBind = this.validationPools[name];
      if (valiBind) {
        valiBind.forEach((validate) => {
          if (validate) {
            validate();
          }
        });
      }

      this.items[id].$validation = err;
    };
  }

  componentWillReceiveProps (nextProps) {
    if (!deepEqual(this.props.data, nextProps.data)) {
      this.setState({ data: nextProps.data });

      // if data changed, clear validation
      forEach(this.items, (item) => {
        delete item.$validation;
      });
    }
  }

  validate () {
    let success = true;
    forEach(this.items, (item) => {
      let suc = item.$validation;
      if (suc === undefined) {
        suc = item.validate();
        this.items[item.id].$validation = suc;
      }
      success = success && (suc === true);
    });
    return success;
  }

  handleSubmit (event) {
    if (this.props.disabled) {
      return;
    }

    event.preventDefault();
    this.submit();
  }

  submit () {
    let success = this.validate();
    if (success && this.props.beforeSubmit) {
      success = this.props.beforeSubmit();
    }

    if (!success) {
      return;
    }

    if (this.props.onSubmit) {
      // send clone data
      let data = clone(this.state.data);

      // remove ignore value
      forEach(this.items, (item) => {
        if (item.ignore) {
          delete data[item.name];
        }
      });

      this.props.onSubmit(data);
    }

    return true;
  }

  renderControls () {
    const { data } = this.state;
    const { hintType, controls, disabled, layout } = this.props;

    return clone(controls).map((control, i) => {
      if (typeof control !== 'object') {
        return control;
      } else {
        control.hintType = control.hintType || hintType;
        control.readOnly = control.readOnly || disabled;
        control.layout = layout;
        control.itemBind = this.itemBind;
        control.itemUnbind = this.itemUnbind;
        control.itemChange = this.itemChange;
        control.formData = data;
        return <FormControl key={i} { ...control } />;
      }
    });
  }

  renderChildren () {
    let { data } = this.state;
    let { fetchStatus, disabled } = this.props;

    return Children.map(this.props.children, (child) => {
      if (!child) { return null; }
      if (typeof child === 'string') { return child; }
      let { hintType, readOnly } = child.props;
      let props = {
        hintType: hintType || this.props.hintType,
        readOnly: readOnly || disabled,
        layout: this.props.layout
      };
      if (child.type === FormControl || child.type.displayName === 'FormItem') {
        props.itemBind = this.itemBind;
        props.itemUnbind = this.itemUnbind;
        props.itemChange = this.itemChange;
        props.formData = data;
      } else if (child.type === FormSubmit) {
        props.disabled = disabled;
        if (fetchStatus !== FETCH_SUCCESS) {
          props.children = getLang('fetch.status')[fetchStatus];
        }
      }

      return cloneElement(child, props);
    });
  }

  renderButton (text) {
    return <FormSubmit disabled={this.props.disabled}>{text}</FormSubmit>;
  }

  render () {
    let { button, controls, fetchStatus, className, onSubmit, grid, layout, ...props } = this.props;

    className = classnames(
      className,
      getGrid(grid),
      'rct-form',
      {
        'rct-form-aligned': layout === 'aligned',
        'rct-form-inline': layout === 'inline',
        'rct-form-stacked': layout === 'stacked'
      }
    );

    return (
      <form onSubmit={this.handleSubmit} className={className} {...props}>
        {controls && this.renderControls()}
        {this.renderChildren()}
        {button && this.renderButton(button)}
        {fetchStatus !== FETCH_SUCCESS && <div className="rct-form-mask" />}
      </form>
    );
  }
}

Form.propTypes = {
  autoComplete: PropTypes.bool,
  beforeSubmit: PropTypes.func,
  button: PropTypes.string,
  children: PropTypes.any,
  className: PropTypes.string,
  controls: PropTypes.array,
  data: PropTypes.object,
  disabled: PropTypes.bool,
  fetchStatus: PropTypes.string,
  grid: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.object
  ]),
  hintType: PropTypes.oneOf(['block', 'none', 'pop', 'inline']),
  layout: PropTypes.oneOf(['aligned', 'stacked', 'inline']),
  onSubmit: PropTypes.func,
  style: PropTypes.object
};

Form.defaultProps = {
  autoComplete: false,
  data: {},
  layout: 'aligned',
  disabled: false
};

module.exports = fetchEnhance(Form);