import React, { Component } from 'react';
import { 
  View, Animated, PanResponder, Dimensions, StyleSheet,
  UIManager, LayoutAnimation, Platform
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;  // in pixels
const SWIPE_TRESHOLD = SCREEN_WIDTH * .38;  // in pixels
const SWIPE_OUT_DURATION = 320;   // in milliseconds

class Deck extends Component {

  static defaultProps = {
    onSwipeRight: () => { }, 
    onSwipeLeft: () => { } 
  }

  constructor(props){
    super(props);

    const position = new Animated.ValueXY();

    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (event, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (event, gesture) => {
        if(gesture.dx > SWIPE_TRESHOLD) {
          this.forceSwipe('right');
        }
        else if(gesture.dx < -SWIPE_TRESHOLD) {
          this.forceSwipe('left');
        }
        else{
          this.resetPosition();
        }
      }
    });

    this.state = { panResponder, position, index: 0 };
  }

  componentWillMount() {
    if (Platform.OS === 'android') {
      UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }

  componentWillUpdate() {
    LayoutAnimation.spring();
  }

  forceSwipe (direction) {
    const x = direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH;
    Animated.timing(this.state.position, {
      toValue: { x, y: 0 },
      duration: SWIPE_OUT_DURATION
    }).start(() => this.onSwipeComplete(direction));
  }

  onSwipeComplete(direction){
    const { onSwipeRight, onSwipeLeft, data } = this.props;
    const item = data[this.state.index];
    direction === 'right' ? onSwipeRight(item) : onSwipeRight(item);
    this.setState({ index: this.state.index + 1 });
    this.state.position.setValue({ x: 0, y: 0 });
  }

  resetPosition(){
    Animated.spring(this.state.position, {
      toValue: { x: 0, y: 0 }
    }).start();
  }

  getCardStyle = () => {
    const { position } = this.state;
    const rotate = position.x.interpolate({
      inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      outputRange: ['-70deg', '0deg', '70deg']
    });
    return {
      ...position.getLayout(),
      transform: [
        { rotate },
        // the next line actually does not working for me in Expo on Android
        //{ perspective: 1000 }, // without this line this Animation will not render on Android while working fine on iOS
      ],
    };
  }

  getNoAnimatedCardStyle =() => {
    return {
      transform: [{ rotate: '0deg' }],
    }
  }

  renderCards = () => {

    if(this.state.index >= this.props.data.length){
      return this.props.renderNoMoreCards();
    }

    return this.props.data.map(
      (item, idx) => {

        if(idx < this.state.index) {
          return null;
        }

        if (idx === this.state.index) {
          return (
            <Animated.View
              key={item.id}
              style={[this.getCardStyle(), styles.cardStyle]}
              {...this.state.panResponder.panHandlers}
            >
              {this.props.renderCard(item)}
            </Animated.View>
          );
        }

        return (
          <View
            key={item.id}
            style={[
              this.getNoAnimatedCardStyle(),
              styles.cardStyle,
              { top: 10 * (idx - this.state.index) }
            ]}
          >
            {this.props.renderCard(item)}
          </View>
        );
      }
    ).reverse();
  }

  render(){
    return (
      <View style={{ top: 15 }}>
        {this.renderCards()}
      </View>
    );
  }
};

const styles = StyleSheet.create({
  cardStyle: {
    flex: 1,
    position: 'absolute',
    width: SCREEN_WIDTH,
  }
});

export default Deck;