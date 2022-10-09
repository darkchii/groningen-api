import { Avatar, Chip, Link, Paper, Tooltip, Typography } from "@mui/material";
import { Component } from "react";
const borderSize = '5px';

export class UserChip extends Component {

    getColor(){
        if(this.props.user.color === null){
            return 'ffffff';
        }
        return this.props.user.color;
    }

    render() {
        return (
            <Tooltip title={this.props.user.note} enterDelay={300} leaveDelay={50}>
                <Link href={`https://osu.ppy.sh/users/${this.props.user.id}`} target='_blank'>
                    <Chip sx={{ 
                        bgcolor: `#${this.getColor()}33`,
                        '&:hover': {
                            boxShadow: `0 0 10px 0 #${this.getColor()}ff`,
                        }
                        }} size="small" avatar={<Avatar alt={this.props.user.username} src={`https://a.ppy.sh/${this.props.user.id}?1664838093.jpeg`} />} label={this.props.user.username} />
                </Link>
            </Tooltip>
        )
    }
}