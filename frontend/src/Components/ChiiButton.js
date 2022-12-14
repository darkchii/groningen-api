import { Link, Typography } from "@mui/material";
import { Component } from "react";
const borderSize = '5px';
export class ChiiButton extends Component {
    render() {
        return (
            <>
                <Link target='_blank' onClick={() => this.props.onClick()} href={this.props.href} sx={{
                    alignItems: 'center',
                    backgroundColor: '#1b2838bb',
                    borderRadius: borderSize,
                    display: 'flex',
                    p: this.props.size === 'small' ? 0.5 : 1,
                    color: 'white',
                    textDecoration: 'none',
                    userSelect: 'none',
                    transition: '0.1s ease-in-out',
                    borderLeftColor: `${this.props.color}55`,
                    borderLeftStyle: 'solid',
                    opacity: `${this.props.selected ? '1.0' : '0.7'}`,
                    '&:hover': {
                        backgroundColor: '#1b283855',
                        borderLeftColor: `${this.props.color}99`,
                        borderLeftWidth: '15px',
                        borderLeftStyle: 'solid',
                        boxShadow: `0px 0px 10px 0px ${this.props.color}55`,
                        pr: -15
                    }
                }}>
                    <Typography variant='subtitle2'>{this.props.name}</Typography>
                </Link>
            </>
        )
    }
}