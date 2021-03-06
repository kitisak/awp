import {ChatActions, RoomPageActions} from '../../actions'
import React, {Component} from 'react';

import FormGroup from '../../components/FormGroup'
import FormSection from '../../components/FormSection'
import OrderPage from './pages/OrderPage'
import ErrorPage from './pages/ErrorPage'
import PageContainer from '../../components/PageContainer'
import PrimaryBtn from '../../components/PrimaryBtn';
import RestaurantPage from './pages/RestaurantPage'
import RestaurantSearchBox from '../../components/RestaurantSearchBox';
import RoomPin from '../../components/RoomPin';
import StatusBar from '../../components/StatusBar'
import SummaryPage from './pages/SummaryPage'
import TextInput from '../../components/TextInput';
import VotePage from './pages/VotePage'
import _ from 'lodash'
import {bindActionCreators} from 'redux'
import {connect} from 'react-redux';
import moment from 'moment'

const RestaurantCard = (r) => {
  if (!r) {
    return;
  }
  return (
    <div>
      {r.get('name')}
    </div>
  )
}

const states = ['Nominate', 'Vote', 'Order', 'Summary']

const dateFormat = 'mm:ss'

class RoomPage extends Component {
  constructor(props, ctx) {
    super(props, ctx)
    this.state = {
      roomState: null,
      remainingTime: 0,
    }
  }

  componentDidMount() {
    this.props.subscribeRoom(this.props.match.params.id)

    this.timerId = setInterval(() => {
      const {room} = this.props
      if (!room) {
        return
      }

      const { roomState, remainingTime } = this.getRoomState(room)
      this.setState({roomState, remainingTime})
    }, 1000);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.room && nextProps.room) {
      const { roomState, remainingTime } = this.getRoomState(nextProps.room)
      this.setState({
        roomState,
        remainingTime
      })
    }
  }

  componentWillUnmount() {
    clearInterval(this.timerId)
  }

  getRoomState(room) {
    const start = room.startTime
      const now = new Date().getTime()

      const nominateTimeInMs = room.nominateTime * 60 * 1000
      const endOfNominateTime = start + nominateTimeInMs

      const voteTimeInMs = 1 * 60 * 1000
      const endOfVoteTime = endOfNominateTime + voteTimeInMs

      let roomState
      let remainingTime
      if (now < endOfNominateTime) {
        roomState = 'Nominate'
        remainingTime = moment(endOfNominateTime - now).format(dateFormat)
      } else if (now < endOfVoteTime) {
        roomState = 'Vote'
        remainingTime = moment(endOfVoteTime - now).format(dateFormat)
      } else {
        roomState = room.lockMenu ? 'Summary' : 'Order'
        remainingTime = null
        clearInterval(this.timerId)
      }

      const hasRestaurants = room.restaurants && _.values(room.restaurants).length > 0;

      if (!hasRestaurants && roomState !== 'Nominate') {
        roomState = 'Error';
      }

      return { roomState, remainingTime }
  }

  renderSetName = () => {
    return (
      <PageContainer>
        <FormSection>
          <RoomPin pin={this.props.match.params.id} style={{
            marginBottom: '50px'
          }} />
          <FormGroup>
            <input type="text" className="text-input" placeholder="Enter your name" ref="name"/>
          </FormGroup>
          <PrimaryBtn
            onClick={() => {
            this
              .props
              .tryJoinRoomWithName(this.props.match.params.id, this.refs.name.value)
          }}>
            Join
          </PrimaryBtn>
        </FormSection>
      </PageContainer>
    )
  }

  renderSelectRestaurant = () => {
    return (
      <div>
        <h1>Room page</h1>
        <div>
          <h2>Restaurants:
            <button >Show nearby</button>
            <RestaurantSearchBox onSelect={console.log}/>
          </h2>
          {/*{(room.get('restaurants') || []).map((r, idx) => {})}*/}
        </div>
        <div>
          <h2>Members:</h2>
          {_
            .values(this.props.room.users)
            .map((name, idx) => (
              <div key={idx}>{name}</div>
            ))}
        </div>
      </div>
    )
  }

  getPage(roomState) {
    switch (this.state.roomState) {
      case 'Nominate':
        return <RestaurantPage />;
      case 'Vote':
        return <VotePage/>;
      case 'Order':
        return <OrderPage/>;
      case 'Summary':
        return <SummaryPage/>;
      case 'Error':
        return <ErrorPage/>;
    }
  }

  render() {
    // return <OrderPage />;
    if (!this.props.me) {
      return this.renderSetName()
    } else if (this.props.me && this.props.room) {
      return (
        <div>
          {this.state.roomState !== 'Error' && <StatusBar
            states={states}
            currentState={this.state.roomState}
            remainingTime={this.state.remainingTime}/>}
          {this.getPage(this.state.roomState)}
        </div>
      )
    } else {
      return null
    }
  }
}

export default connect(
  ({me, room}) => ({me, room}), 
  (dispatch) => bindActionCreators(_.extend({}, RoomPageActions, ChatActions), dispatch),
)(RoomPage)
