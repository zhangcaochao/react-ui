import { Component } from 'react'
import classnames from 'classnames'
import PropTypes from '../utils/proptypes'
import { getGrid } from '../utils/grids'
import { compose } from '../utils/compose'
import { substitute } from '../utils/strings'
import FormItem from '../higherOrders/FormItem'
import Upload from './Upload'
import { ERROR } from './status'

import _styles from '../styles/_upload.scss'

class FileUpload extends Component {
  constructor (props) {
    super(props)
    this.addFile = this.addFile.bind(this)
  }

  addFile () {
    let ul = this.refs.ul
    this.props.onFileAdd((id, e) => {
      let progress = ul.querySelector(`#up_pr_${id}`)
      progress.style.backgroundSize = (e.loaded / e.total) * 100 + '%' + ' 2px'
    })
  }

  renderValues () {
    const { value, textTpl, removeValue } = this.props
    return value.map((v, i) => (
      <li key={i}>
        <span>{substitute(textTpl, v)}</span>
        <a className={_styles.remove}
          onClick={() => removeValue(i)}>
          &times;
        </a>
      </li>
    ))
  }

  renderFiles () {
    const { files, removeFile } = this.props

    return Object.keys(files).map(k => {
      const file = files[k]
      let className = classnames(file.status === ERROR && _styles['has-error'])
      return (
        <li key={k} id={`up_pr_${k}`} className={className}>
          <span>{file.name}</span>
          <a className={_styles.remove}
            onClick={() => removeFile(k)}>
            &times;
          </a>
        </li>
      )
    })
  }

  render () {
    const { grid, limit, style, children, disabled, readOnly, value, files } = this.props

    let className = classnames(
      this.props.className,
      getGrid(grid),
      _styles.upload
    )

    const allowAdd = !disabled && !readOnly && (value.length + Object.keys(files).length) < limit

    return (
      <div className={className} style={style}>
        { allowAdd && <div onClick={this.addFile}>{children}</div> }
        <ul ref="ul">
          { this.renderValues() }
          { this.renderFiles() }
        </ul>
      </div>
    )
  }
}

FileUpload.propTypes = {
  children: PropTypes.any,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  files: PropTypes.object,
  grid: PropTypes.grid,
  limit: PropTypes.number,
  onFileAdd: PropTypes.func,
  readOnly: PropTypes.bool,
  removeFile: PropTypes.func,
  removeValue: PropTypes.func,
  style: PropTypes.object,
	textTpl: PropTypes.func_string,
  value: PropTypes.array
}

FileUpload.defaultProps = {
  textTpl: '{name}'
}

export default compose(
  FormItem.register('upload', {valueType: 'array'}),
  Upload
)(FileUpload)